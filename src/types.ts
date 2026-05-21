export interface Metric {
  name: string;
  dayValue?: string;
  monthValue?: string;
}

export interface DashboardData {
  metrics: Metric[];
  currentClients: string[]; // List of client names
}
