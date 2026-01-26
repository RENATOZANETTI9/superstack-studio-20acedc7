export type Permission = 
  | 'view_dashboard' 
  | 'upload_base' 
  | 'view_clients' 
  | 'send_messages' 
  | 'manage_users' 
  | 'manage_marketing' 
  | 'view_reports' 
  | 'export_data';

export interface SubUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  permissions: Permission[];
  createdAt: Date;
  lastAccess?: Date;
  active: boolean;
}
