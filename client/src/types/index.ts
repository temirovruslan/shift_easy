
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

export interface UserTypes {
  company: {
    _id: string;
    name: string;
    managers: { _id: string; name: string }[];
  };
  createdAt: string;
  email: string;
  isActivated: boolean;
  name: string;
  role: string;
  updatedAt: string;
  sites: {
    _id: string;
    name: string;
  }[];
}