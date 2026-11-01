import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomepageComponent } from './homepage';

describe('HomepageComponent', () => {
  let component: HomepageComponent;
  let fixture: ComponentFixture<HomepageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomepageComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomepageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show a welcome screen with the animated name', () => {
    const heading = fixture.nativeElement.querySelector('h1') as HTMLHeadingElement;
    expect(heading.getAttribute('aria-label')).toBe('Steven Jonathan');
    expect(fixture.nativeElement.textContent).toContain('Welcome. Stay a while.');
    expect(fixture.nativeElement.querySelectorAll('.name-letter').length).toBe(15);
  });
});
