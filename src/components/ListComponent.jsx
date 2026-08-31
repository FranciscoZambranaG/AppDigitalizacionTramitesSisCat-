import React from 'react'
import {FlatList,View,TouchableOpacity,Image,Text, StyleSheet} from 'react-native'
import { Feather as Icon } from '@expo/vector-icons';

function ListComponent({data,onDelete, onSelect, modalVisible, openPDF}) {
  return (
    <FlatList
              data={data}
              keyExtractor={item => item.name}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => openPDF(item.path)}>
                    <Image
                      source={require('../assets/pdf-icon.png')}
                      style={styles.image}
                    />
                    <View style={styles.infoContainer}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.date}>{item.descripcion}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={() => {  onSelect(item); 
                                        modalVisible(true)}}>
                      {/*onPress={() => {
                        setSelectedFile(item);
                        setModalVisible(true);
                      }}>*/}
                      <Icon name="upload" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => onDelete(item.path)}>
                      {/*onPress={() => handleDelete(item.path)}>*/}
                      <Icon name="trash-2" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
  )
}
const styles = StyleSheet.create({
    card: { flexDirection: 'row', backgroundColor: 'white', padding: 10, marginBottom: 10, borderRadius: 8, alignItems: 'center', elevation: 3 },
    image: { width: 50, height: 50, borderRadius: 8 },
    infoContainer: { flex: 1, marginLeft: 10 },
    name: { fontSize: 16, fontWeight: 'bold' },
    date: { fontSize: 14, color: '#666' },
    actionButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginRight: 5 },
    sendButton: { backgroundColor: '#28a745', padding: 8, borderRadius: 8, marginRight: 5 },
    deleteButton: { backgroundColor: '#3f008c', padding: 8, borderRadius: 8 },
    sendText: { color: 'white', fontWeight: 'bold' },  
})

export default ListComponent