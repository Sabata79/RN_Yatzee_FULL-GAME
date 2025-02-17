// AvatarContainer.js
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, Image, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isFoldScreen = width < 800;
const avatarSize = isFoldScreen ? 65 : 70;

// Määritellään tasojen järjestys (pienillä kirjaimilla)
const levelOrder = ['basic', 'advanced', 'elite', 'legendary'];

const AvatarContainer = ({ isVisible, onClose, avatars, handleAvatarSelect, playerLevel }) => {
  const tabs = ['Basic', 'Advanced', 'Elite', 'Legendary'];
  const [selectedTab, setSelectedTab] = useState('Basic');

  // Laske effectivePlayerLevel aina, käyttäen oletusarvoa "basic" jos playerLevel on undefined.
  const effectivePlayerLevel = (playerLevel || 'basic').toLowerCase();

  // Päivitetään selectedTab, jos pelaajan taso on pienempi kuin nykyinen valittu välilehti
  useEffect(() => {
    const currentTabIndex = levelOrder.indexOf(selectedTab.toLowerCase());
    const playerLevelIndex = levelOrder.indexOf(effectivePlayerLevel);
    if (currentTabIndex > playerLevelIndex) {
      // Aseta selectedTabksi pelaajan tason mukainen välilehti
      const newTab = levelOrder[playerLevelIndex];
      setSelectedTab(newTab.charAt(0).toUpperCase() + newTab.slice(1));
    }
  }, [playerLevel, selectedTab, effectivePlayerLevel]);

  // Suodatetaan avatarit valitun välilehden mukaan käyttäen case-insensitive vertailua
  const filteredAvatars = avatars.filter(
    avatar => avatar.level && avatar.level.toLowerCase() === selectedTab.toLowerCase()
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.avatarModalBackground}>
        <View style={styles.avatarModalContainer}>
          {/* Välilehdet */}
          <View style={styles.tabsContainer}>
            {tabs.map(tab => {
              // Tarkistetaan, onko välilehti lukittu pelaajan tason perusteella.
              const isLocked =
                levelOrder.indexOf(effectivePlayerLevel) < levelOrder.indexOf(tab.toLowerCase());
              return (
                <Pressable
                  key={tab}
                  style={[
                    styles.tabButton,
                    selectedTab.toLowerCase() === tab.toLowerCase() && styles.activeTabButton,
                    isLocked && styles.lockedTabButton,
                  ]}
                  onPress={() => {
                    if (!isLocked) {
                      setSelectedTab(tab);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab.toLowerCase() === tab.toLowerCase() && styles.activeTabText,
                    ]}
                  >
                    {tab}
                  </Text>
                  {isLocked && (
                    <FontAwesome5
                      name="lock"
                      size={14}
                      color="gold"
                      style={{ marginLeft: 5 }}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.avatarSelectText}>Choose your Avatar:</Text>

          <Pressable style={styles.closeAvatarModalButton} onPress={onClose}>
            <Text style={styles.closeAvatarModalText}>X</Text>
          </Pressable>

          <View style={styles.avatarSelectionWrapper}>
            {filteredAvatars.map((avatar, index) => (
              <Pressable key={index} onPress={() => handleAvatarSelect(avatar)}>
                <Image style={styles.avatarModalImage} source={avatar.display} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  avatarModalBackground: {
    flex: 1,
    marginTop: '15%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  avatarModalContainer: {
    width: '80%',
    height: '90%',
    backgroundColor: '#141414',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  avatarSelectText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  closeAvatarModalButton: {
    position: 'absolute',
    right: 10,
    top: 2,
  },
  closeAvatarModalText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    padding: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  tabButton: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 5,
    backgroundColor: '#ccc',
  },
  activeTabButton: {
    backgroundColor: '#62a346',
  },
  lockedTabButton: {
    backgroundColor: '#999',
  },
  tabText: {
    color: '#333',
    fontSize: 12,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  avatarSelectionWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  avatarModalImage: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    margin: 5,
    resizeMode: 'contain',
  },
});

export default AvatarContainer;
