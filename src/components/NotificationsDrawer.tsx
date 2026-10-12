import { useAuth } from '../context/AuthContext';
import { DeviceNotifications } from './DeviceNotifications';
interface Props { isOpen: boolean; onClose: () => void; onOpenInbox: () => void; }
export const NotificationsDrawer = ({ isOpen, onClose }: Props) => {
  const { status, isDevMode } = useAuth();
  if (!isOpen) return null;
  return <div role="dialog" aria-modal="true" aria-label="Notifications Drawer" className="fixed inset-0 z-50 overflow-auto bg-[#062416] p-5 text-white">
    <button type="button" onClick={onClose}>Close notifications</button>
    {status === 'authenticated' && !isDevMode ? <DeviceNotifications surface="owner" /> : <p>Sign in to load real notifications. Simulation does not send device alerts.</p>}
  </div>;
};
