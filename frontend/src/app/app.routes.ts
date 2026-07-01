import { Routes } from '@angular/router';

import { DiffsPage } from './pages/diffs.page';
import { DocumentsPage } from './pages/documents.page';
import { EndpointDetailPage } from './pages/endpoint-detail.page';
import { OverviewPage } from './pages/overview.page';
import { RegistryPage } from './pages/registry.page';
import { ReliabilityPage } from './pages/reliability.page';

export const routes: Routes = [
  { path: '', component: OverviewPage },
  { path: 'registry', component: RegistryPage },
  { path: 'registry/:id', component: EndpointDetailPage },
  { path: 'diffs', component: DiffsPage },
  { path: 'reliability', component: ReliabilityPage },
  { path: 'replay', component: ReliabilityPage },
  { path: 'documents', component: DocumentsPage },
  { path: '**', redirectTo: '' },
];
