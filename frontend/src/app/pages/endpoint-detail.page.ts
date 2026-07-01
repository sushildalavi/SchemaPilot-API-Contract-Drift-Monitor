import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';

import { ApiService } from '../api.service';

@Component({
  standalone: true,
  imports: [AsyncPipe, JsonPipe, RouterLink],
  templateUrl: './endpoint-detail.page.html',
  styleUrl: './shared.css',
})
export class EndpointDetailPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly detail$ = this.route.paramMap.pipe(
    map((params) => params.get('id')),
    switchMap((id) => this.api.getEndpointDetail(id ?? '')),
  );

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
