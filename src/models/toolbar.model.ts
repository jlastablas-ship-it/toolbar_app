
export interface ToolbarItem {
  id: string; // unique id for list tracking
  iconType: 'fa' | 'user';
  iconCode: string; // fa class name or image id
  tooltip: string;
  action: string;
}

export interface Toolbar {
  id?: number;
  name: string;
  description: string;
  items: ToolbarItem[];
  created_at: Date;
}

export interface UserImage {
  id?: number;
  name: string;
  data: string; // Base64 data URL
  created_at: Date;
}
