
export interface Site {
  _id: string;
  name: string;
  address: string;
}

export interface Shift {
  _id: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "active" | "completed";
  site: Site;
  notes?: string;
  materials?: string;
}
