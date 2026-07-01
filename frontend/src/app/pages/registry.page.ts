import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../api.service';

@Component({
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './registry.page.html',
  styleUrl: './shared.css',
})
export class RegistryPage {
  private readonly api = inject(ApiService);
  readonly registry$ = this.api.getRegistryOverview();

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
