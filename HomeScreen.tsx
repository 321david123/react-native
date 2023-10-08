import React, {useCallback, useEffect, useMemo} from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useBleContext} from './BleContextProvider';

interface HomeScreenProps {}

const HomeScreen: React.FC<HomeScreenProps> = () => {
  const {
    isConnected,
    isScanning,
    peripherals,
    connectedBle,
    startScan,
    connectBle,
  } = useBleContext();

  // Effects
  const scannedbleList = useMemo(() => {
    const list = [];
    if (connectedBle) list.push(connectedBle);
    if (peripherals) list.push(...Array.from(peripherals.values()));
    return list;
  }, [peripherals, isScanning]);

  useEffect(() => {
    if (!isConnected) {
      startScan && startScan();
    }
  }, []);

  // Methods
  const getRssi = (rssi: number) => {
    return !!rssi
      ? Math.pow(10, (-69 - rssi) / (10 * 2)).toFixed(2) + ' m'
      : 'N/A';
  };

  const onBleConnected = (name: string) => {
    Alert.alert('Device connected', `Connected to ${name}.`, [
      {
        text: 'Ok',
        onPress: () => {},
        style: 'default',
      },
    ]);
  };
  const BleListItem = useCallback((item: any) => {
    // define name and rssi
    return (
      <TouchableOpacity
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: 16,
          backgroundColor: '#2A2A2A',
        }}
        onPress={() => {
          connectBle && connectBle(item.item, onBleConnected);
        }}>
        <Text style={{textAlign: 'left', marginRight: 8, color: 'white'}}>
          {item.item.name}
        </Text>
        <Text style={{textAlign: 'right'}}>{getRssi(item.item.rssi)}</Text>
      </TouchableOpacity>
    );
  }, []);

  const ItemSeparator = useCallback(() => {
    return <View style={styles.divider} />;
  }, []);

  // render
  // Ble List and scan button
  return (
    <View style={styles.container}>
      {/* Loader when app is scanning */}
      {isScanning ? (
        <ActivityIndicator size={'small'} />
      ) : (
        <>
          {/* Ble devices List View */}
          {scannedbleList && scannedbleList.length > 0 ? (
            <>
              <Text style={styles.listHeader}>Discovered BLE Devices</Text>
              <FlatList
                data={scannedbleList}
                renderItem={({item}) => <BleListItem item={item} />}
                ItemSeparatorComponent={ItemSeparator}
              />
            </>
          ) : (
            <View style={styles.emptyList}>
              <Text style={styles.emptyListText}>
                No Bluetooth devices discovered. Please click scan to search the
                BLE devices
              </Text>
            </View>
          )}

          {/* Scan button */}
          <View style={styles.btnContainer}>
            <Button
              title="Scan"
              color={'black'}
              disabled={isConnected || isScanning}
              onPress={() => {
                startScan && startScan();
              }}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  listHeader: {
    padding: 8,
    color: 'black',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListText: {
    padding: 8,
    textAlign: 'center',
    color: 'black',
  },
  btnContainer: {
    marginTop: 10,
    marginHorizontal: 16,
    bottom: 10,
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
    width: '100%',
    marginHorizontal: 8,
    backgroundColor: '#1A1A1A',
  },
});

export default HomeScreen;