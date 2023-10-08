import React, { createContext, useContext, useEffect, useReducer } from 'react';
import BleManager from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules } from 'react-native';

// Define the context for BLE connection management
export const BleContext = createContext<any>(null);

// Custom hook to access the BLE connection context
export const useBleContext = () => {
  const context = useContext(BleContext);
  if (!context) {
    throw new Error("useBleContext must be used within a BleContextProvider");
  }
  return context;
};

// Initial BLE state
const initialState = {
  isConnected: false,
  isScanning: false,
  peripherals: new Map(),
  connectedBle: undefined,
};

// Reducer function to manage BLE state
const bleReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'scanning':
      return {
        ...state,
        isScanning: action.payload,
      };
    case 'connected':
      return {
        ...state,
        connectedBle: action.payload.peripheral,
        isConnected: true,
      };
    case 'disconnected':
      return {
        ...state,
        connectedBle: undefined,
        isConnected: false,
      };
    case 'clearPeripherals':
      const peripherals = new Map();
      return {
        ...state,
        peripherals,
      };
    case 'addPeripheral':
      const newPeripherals = new Map(state.peripherals);
      newPeripherals.set(action.payload.id, action.payload.peripheral);
      return {
        ...state,
        peripherals: newPeripherals,
      };
    default:
      return state;
  }
};

export const BleContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Variables
  const BleManagerModule = NativeModules.BleManager;
  const bleEmitter = new NativeEventEmitter(BleManagerModule);

  // State management
  const [state, dispatch] = useReducer(bleReducer, initialState);

  // Methods
  const startScan = () => {
    if (state.isScanning) {
      return;
    }

    dispatch({ type: 'clearPeripherals' });

    BleManager.scan([], 10, false)
      .then(() => {
        console.log('Scanning...');
        dispatch({ type: 'scanning', payload: true });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const connectBle = (peripheral: any) => {
    BleManager.connect(peripheral.id)
      .then(() => {
        dispatch({ type: 'connected', payload: { peripheral } });
        BleManager.retrieveServices(peripheral.id).then(() => {
          BleManager.startNotification(
            peripheral.id,
            BLE_SERVICE_ID,
            BLE_READ_CHAR_ID
          )
            .then(() => {
              console.log('Started notification for reading data');
            })
            .catch((error) => {
              console.error('Error starting notification:', error);
            });
        });
      })
      .catch((error) => {
        console.error('Failed to connect to the device:', error);
      });
  };

  const readFromBle = (peripheralId: string) => {
    BleManager.read(
      peripheralId,
      BLE_SERVICE_ID,
      BLE_READ_CHAR_ID
    )
      .then((data) => {
        console.log('Read data from BLE device:', data);
      })
      .catch((error) => {
        console.error('Error reading data from BLE device:', error);
      });
  };

  const writeToBle = (peripheralId: string, data: string) => {
    BleManager.writeWithoutResponse(
      peripheralId,
      BLE_SERVICE_ID,
      BLE_WRITE_CHAR_ID,
      toByteArray(data)
    )
      .then(() => {
        console.log('Wrote data to BLE device:', data);
      })
      .catch((error) => {
        console.error('Error writing data to BLE device:', error);
      });
  };

  const disconnectBle = (peripheralId: string) => {
    BleManager.disconnect(peripheralId)
      .then(() => {
        dispatch({ type: 'disconnected' });
        console.log('Disconnected from BLE device:', peripheralId);
      })
      .catch((error) => {
        console.error('Error disconnecting from BLE device:', error);
      });
  };

  // Effects
  useEffect(() => {
    const initBle = async () => {
      await requestBlePermissions();
      BleManager.enableBluetooth();
      BleManager.start({ showAlert: false });
    };

    initBle();

    // Add BLE event listeners
    const discoverPeripheralListener = bleEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverPeripheral
    );
    const stopScanListener = bleEmitter.addListener(
      'BleManagerStopScan',
      handleStopScan
    );
    const disconnectPeripheralListener = bleEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      handleDisconnectedPeripheral
    );

    // Clean up event listeners on unmount
    return () => {
      discoverPeripheralListener.remove();
      stopScanListener.remove();
      disconnectPeripheralListener.remove();
    };
  }, []);

  // Handle discovered peripheral
  const handleDiscoverPeripheral = (peripheral: any) => {
    console.log('Got BLE peripheral:', peripheral.name);
    dispatch({
      type: 'addPeripheral',
      payload: { id: peripheral.id, peripheral },
    });
  };

  // Handle stop scan event
  const handleStopScan = () => {
    console.log('Scan is stopped');
    dispatch({ type: 'scanning', payload: false });
  };

  // Handle disconnected peripheral
  const handleDisconnectedPeripheral = (data: any) => {
    console.log('Disconnected from ' + data.peripheral);
    dispatch({ type: 'disconnected' });
  };

  return (
    <BleContext.Provider
      value={{
        ...state,
        startScan,
        connectBle,
        readFromBle,
        writeToBle,
        disconnectBle,
      }}
    >
      {children}
    </BleContext.Provider>
  );
};
