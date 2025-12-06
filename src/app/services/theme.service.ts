import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private themeSubject = new BehaviorSubject<'dark' | 'light'>('dark');
    public theme$ = this.themeSubject.asObservable();

    constructor() {
        this.applyTheme('dark');
    }

    toggleTheme() {
        const currentTheme = this.themeSubject.value;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.themeSubject.next(newTheme);
        this.applyTheme(newTheme);
    }

    private applyTheme(theme: 'dark' | 'light') {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }
}