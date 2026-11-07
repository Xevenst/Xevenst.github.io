const MAX_FILE_BYTES = 20 * 1024 * 1024;
const FIRESTORE_ROOT = 'https://firestore.googleapis.com/v1/projects/';

function doPost(event) {
  let request;
  let idToken;
  let authorized = false;

  try {
    request = JSON.parse(event.postData.contents);
    idToken = String(request.idToken || '');
    if (!/^[\da-f-]{36}$/i.test(String(request.requestId || ''))) {
      throw new Error('Invalid upload request ID.');
    }

    authorizeAdmin(idToken);
    authorized = true;

    if (request.action === 'upload') {
      uploadFile(request, idToken);
    } else if (request.action === 'delete') {
      deleteFile(request, idToken);
    } else {
      throw new Error('Unsupported file operation.');
    }

    patchDocument(idToken, 'site_file_jobs', request.requestId, {
      status: 'completed',
      finishedAt: new Date().toISOString(),
    });
    return jsonOutput({ ok: true });
  } catch (error) {
    if (authorized && request && request.requestId) {
      try {
        patchDocument(idToken, 'site_file_jobs', request.requestId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Google Drive operation failed.',
          finishedAt: new Date().toISOString(),
        });
      } catch (statusError) {
        console.error('Unable to report the Drive operation failure.', statusError);
      }
    }
    return jsonOutput({ ok: false });
  }
}

function authorizeSetup() {
  const config = getConfig();
  const folder = DriveApp.getFolderById(config.folderId);
  UrlFetchApp.fetch('https://www.google.com/generate_204', { muteHttpExceptions: true });
  console.log('Google Drive destination is ready: ' + folder.getName());
}

function uploadFile(request, idToken) {
  const config = getConfig();
  const fileName = sanitizeFileName(request.fileName);
  const mimeType = String(request.contentType || 'application/octet-stream');
  if (!isAllowedFile(fileName, mimeType)) {
    throw new Error('Only PDF, image, and audio files are allowed.');
  }

  const encoded = String(request.base64 || '');
  if (!encoded || encoded.length > Math.ceil(MAX_FILE_BYTES * 4 / 3) + 8) {
    throw new Error('Files must be 20 MB or smaller.');
  }
  const bytes = Utilities.base64Decode(encoded);
  if (bytes.length > MAX_FILE_BYTES) {
    throw new Error('Files must be 20 MB or smaller.');
  }

  const folder = DriveApp.getFolderById(config.folderId);
  let file;
  let recordMayExist = false;
  try {
    file = folder.createFile(Utilities.newBlob(bytes, mimeType, fileName));
    if (request.visibility === 'public') {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    recordMayExist = true;
    patchDocument(idToken, 'site_files', request.requestId, {
      id: request.requestId,
      name: file.getName(),
      driveFileId: file.getId(),
      contentType: file.getMimeType(),
      size: file.getSize(),
      downloadUrl: file.getUrl(),
      uploadedAt: new Date().toISOString(),
      visibility: request.visibility === 'public' ? 'public' : 'private',
    });
  } catch (error) {
    if (recordMayExist) {
      try {
        deleteDocument(idToken, 'site_files', request.requestId);
      } catch (cleanupError) {
        console.error('Unable to remove the partial Firestore file record.', cleanupError);
      }
    }
    if (file) {
      try {
        file.setTrashed(true);
      } catch (cleanupError) {
        console.error('Unable to remove the partial Google Drive file.', cleanupError);
      }
    }
    throw error;
  }
}

function deleteFile(request, idToken) {
  const config = getConfig();
  const recordId = String(request.recordId || '');
  const driveFileId = String(request.driveFileId || '');
  if (!/^[\da-f-]{36}$/i.test(recordId) || !/^[\w-]+$/.test(driveFileId)) {
    throw new Error('Invalid file record.');
  }

  const record = getDocument(idToken, 'site_files', recordId);
  if (record.driveFileId !== driveFileId) {
    throw new Error('The Drive file does not match the saved file record.');
  }

  const file = DriveApp.getFileById(driveFileId);
  const parents = file.getParents();
  let belongsToConfiguredFolder = false;
  while (parents.hasNext()) {
    if (parents.next().getId() === config.folderId) {
      belongsToConfiguredFolder = true;
      break;
    }
  }
  if (!belongsToConfiguredFolder) {
    throw new Error('This file is outside the configured Google Drive folder.');
  }

  file.setTrashed(true);
  try {
    deleteDocument(idToken, 'site_files', recordId);
  } catch (error) {
    try {
      file.setTrashed(false);
    } catch (cleanupError) {
      console.error('Unable to restore the Drive file after its record could not be deleted.', cleanupError);
    }
    throw error;
  }
}

function authorizeAdmin(idToken) {
  const config = getConfig();
  const response = UrlFetchApp.fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(config.apiKey),
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ idToken: idToken }),
      muteHttpExceptions: true,
    },
  );
  if (response.getResponseCode() !== 200) {
    throw new Error('Sign in again before managing Google Drive files.');
  }

  const users = JSON.parse(response.getContentText()).users || [];
  const uid = users.length ? String(users[0].localId || '') : '';
  if (!uid) throw new Error('The Firebase account could not be verified.');

  const adminResponse = UrlFetchApp.fetch(documentUrl(config, 'admin_users', uid), {
    method: 'get',
    headers: { Authorization: 'Bearer ' + idToken },
    muteHttpExceptions: true,
  });
  if (adminResponse.getResponseCode() !== 200) {
    throw new Error('Google Drive uploads require a Firebase administrator account.');
  }
}

function getDocument(idToken, collection, documentId) {
  const response = UrlFetchApp.fetch(documentUrl(getConfig(), collection, documentId), {
    method: 'get',
    headers: { Authorization: 'Bearer ' + idToken },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('The saved file record could not be verified.');
  }
  const fields = JSON.parse(response.getContentText()).fields || {};
  return Object.keys(fields).reduce(function (result, key) {
    const value = fields[key];
    result[key] = value.stringValue !== undefined ? value.stringValue : Number(value.integerValue);
    return result;
  }, {});
}

function patchDocument(idToken, collection, documentId, values) {
  const fields = Object.keys(values).reduce(function (result, key) {
    const value = values[key];
    result[key] = typeof value === 'number'
      ? { integerValue: String(value) }
      : { stringValue: String(value) };
    return result;
  }, {});
  const response = UrlFetchApp.fetch(documentUrl(getConfig(), collection, documentId), {
    method: 'patch',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + idToken },
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Firestore rejected the Google Drive file update.');
  }
}

function deleteDocument(idToken, collection, documentId) {
  const response = UrlFetchApp.fetch(documentUrl(getConfig(), collection, documentId), {
    method: 'delete',
    headers: { Authorization: 'Bearer ' + idToken },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Firestore rejected the file record deletion.');
  }
}

function documentUrl(config, collection, documentId) {
  return FIRESTORE_ROOT + encodeURIComponent(config.projectId)
    + '/databases/(default)/documents/' + collection + '/'
    + encodeURIComponent(documentId);
}

function getConfig() {
  const properties = PropertiesService.getScriptProperties();
  const config = {
    apiKey: properties.getProperty('FIREBASE_API_KEY'),
    projectId: properties.getProperty('FIREBASE_PROJECT_ID'),
    folderId: properties.getProperty('DRIVE_FOLDER_ID'),
  };
  if (!config.apiKey || !config.projectId || !config.folderId) {
    throw new Error('Set FIREBASE_API_KEY, FIREBASE_PROJECT_ID, and DRIVE_FOLDER_ID in Script Properties.');
  }
  return config;
}

function sanitizeFileName(value) {
  const name = String(value || '').replace(/[\\/:*?"<>|]/g, '-').trim().slice(0, 180);
  if (!name || name === '.' || name === '..') throw new Error('A valid file name is required.');
  return name;
}

function isAllowedFile(name, mimeType) {
  const extension = name.toLowerCase().split('.').pop();
  const imageExtensions = ['avif', 'bmp', 'gif', 'heic', 'ico', 'jpeg', 'jpg', 'png', 'svg', 'tif', 'tiff', 'webp'];
  const audioExtensions = ['aac', 'flac', 'm4a', 'mp3', 'ogg', 'opus', 'wav', 'wma'];
  return extension === 'pdf'
    || (imageExtensions.indexOf(extension) >= 0 && mimeType.indexOf('image/') === 0)
    || (audioExtensions.indexOf(extension) >= 0 && mimeType.indexOf('audio/') === 0);
}

function jsonOutput(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
