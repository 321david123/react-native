export const BLE_NAME = "SAMPlE_BLE"
export const BLE_SERVICE_ID = "5476534d-1213-1212-1212-454e544f1212"
export const BLE_READ_CHAR_ID = "00105354-0000-1000-8000-00805f9b34fb"
export const BLE_WRITE_CHAR_ID = "00105352-0000-1000-8000-00805f9b34fb"

export const BleContextProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  // variables
  const BleManagerModule = NativeModules.BleManager
  const bleEmitter = new NativeEventEmitter(BleManagerModule)
  const { setConnectedDevice } = useBleStore()

  // State management
  const [state, dispatch] = React.useReducer(
    (prevState: BleState, action: any) => {
      switch (action.type) {
        case "scanning":
          return {
            ...prevState,
            isScanning: action.payload,
          }
        case "connected":
          return {
            ...prevState,
            connectedBle: action.payload.peripheral,
            isConnected: true,
          }
        case "disconnected":
          return {
            ...prevState,
            connectedBle: undefined,
            isConnected: false,
          }
        case "clearPeripherals":
          let peripherals = prevState.peripherals
          peripherals.clear()
          return {
            ...prevState,
            peripherals: peripherals,
          }
        case "addPerpheral":
          peripherals = prevState.peripherals
          peripherals.set(action.payload.id, action.payload.peripheral)
          const list = [action.payload.connectedBle]
          return {
            ...prevState,
            peripherals: peripherals,
          }
        default:
          return prevState
      }
    },
    initialState
  )

  // methods
  const getPeripheralName = (item: any) => {
    if (item.advertising) {
      if (item.advertising.localName) {
        return item.advertising.localName
      }
    }

    return item.name
  }

  // start to scan peripherals
  const startScan = () => {
    // skip if scan process is currenly happening
    console.log("Start scanning ", state.isScanning)
    if (state.isScanning) {
      return
    }

    dispatch({ type: "clearPeripherals" })

    // then re-scan it
    BleManager.scan([], 10, false)
      .then(() => {
        console.log("Scanning...")
        dispatch({ type: "scanning", payload: true })
      })
      .catch((err) => {
        console.error(err)
      })
  }

  const connectBle = (peripheral: any, callback?: (name: string) => void) => {
    if (peripheral && peripheral.name && peripheral.name == BLE_NAME) {
      BleManager.connect(peripheral.id)
        .then((resp) => {
          dispatch({ type: "connected", payload: { peripheral } })
          // callback from the caller
          callback && callback(peripheral.name)
          setConnectedDevice(peripheral)
        })
        .catch((err) => {
          console.log("failed connecting to the device", err)
        })
    }
  }

  // handle discovered peripheral
  const handleDiscoverPeripheral = (peripheral: any) => {
    console.log("Got ble peripheral", getPeripheralName(peripheral))

    if (peripheral.name && peripheral.name == BLE_NAME) {
      dispatch({
        type: "addPerpheral",
        payload: { id: peripheral.id, peripheral },
      })
    }
  }

  // handle stop scan event
  const handleStopScan = () => {
    console.log("Scan is stopped")
    dispatch({ type: "scanning", payload: false })
  }

  // handle disconnected peripheral
  const handleDisconnectedPeripheral = (data: any) => {
    console.log("Disconnected from " + data.peripheral)

    //
    dispatch({ type: "disconnected" })
  }

  const handleUpdateValueForCharacteristic = (data: any) => {
    console.log(
      "Received data from: " + data.peripheral,
      "Characteristic: " + data.characteristic,
      "Data: " + toStringFromBytes(data.value)
    )
  }

  // effects
  useEffect(() => {
    const initBle = async () => {
      await requestBlePermissions()
      BleManager.enableBluetooth()
    }

    initBle()

    // add ble listeners on mount
    const BleManagerDiscoverPeripheral = bleEmitter.addListener(
      "BleManagerDiscoverPeripheral",
      handleDiscoverPeripheral
    )
    const BleManagerStopScan = bleEmitter.addListener(
      "BleManagerStopScan",
      handleStopScan
    )
    const BleManagerDisconnectPeripheral = bleEmitter.addListener(
      "BleManagerDisconnectPeripheral",
      handleDisconnectedPeripheral
    )
    const BleManagerDidUpdateValueForCharacteristic = bleEmitter.addListener(
      "BleManagerDidUpdateValueForCharacteristic",
      handleUpdateValueForCharacteristic
    )
  }, [])

// render
  return (
    <BleContext.Provider
      value={{
        ...state,
        startScan: startScan,
        connectBle: connectBle,
      }}
    >
      {children}
    </BleContext.Provider>
  )
}