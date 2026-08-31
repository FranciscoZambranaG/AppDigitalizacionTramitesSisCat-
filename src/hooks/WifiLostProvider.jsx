import React,{createContext, useContext,useState, useEffect} from 'react'
import { WifiOffModal } from '../components/WifiOffModal';
import baseUrl from '../api/baseUrl';

const WifiContext = createContext();

 const WifiLostProvider = ({children}) => {
    const [isOffline, setIsOffline] = useState(false);

    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`${baseUrl}/docs`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok && response.status >= 500) {
          throw new Error(`HTTP ${response.status}`);
        }
        setIsOffline(false);
        return true;
      } catch (error) {
        console.log('[WIFI] checkConnection failed', baseUrl, error?.message);
        setIsOffline(true);
        return false;
      }
    }

    useEffect(() => {
      checkConnection();
    }, [])

    const handleCloseModal = () => {
      setIsOffline(false); // Oculta el modal al presionar "Aceptar"
    };
  
    

  return (
    <WifiContext.Provider value={{isOffline, checkConnection}}>
      {children}
      <WifiOffModal visible={isOffline} onCLose={handleCloseModal}/>
    </WifiContext.Provider>
  )
}
export default WifiLostProvider;

export const useWifiLost = () => {
  return useContext(WifiContext);
};