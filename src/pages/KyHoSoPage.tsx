import React from 'react';
import { KyHoSoTongHopPage } from '../components/ky-ho-so';

interface KyHoSoPageProps {
  isActive?: boolean;
}

export const KyHoSoPage: React.FC<KyHoSoPageProps> = ({ isActive = true }) => {
  return (
    <div className="w-full h-full min-h-0 flex-1 flex flex-col">
      <KyHoSoTongHopPage isActive={isActive} />
    </div>
  );
};

export default KyHoSoPage;
