import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private themeSubject = new BehaviorSubject<'dark' | 'light'>('dark');
    public theme$ = this.themeSubject.asObservable();

    constructor(@Inject(PLATFORM_ID) platformId: object) {
        const browser = isPlatformBrowser(platformId);
        const stored = browser ? localStorage.getItem('xevenst-theme') : null;
        const initialTheme = stored === 'light' ? 'light' : 'dark';
        this.themeSubject.next(initialTheme);
        this.applyTheme(initialTheme);
    }

    toggleTheme() {
        const currentTheme = this.themeSubject.value;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.themeSubject.next(newTheme);
        this.applyTheme(newTheme);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('xevenst-theme', newTheme);
        }
    }

    private applyTheme(theme: 'dark' | 'light') {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }
}