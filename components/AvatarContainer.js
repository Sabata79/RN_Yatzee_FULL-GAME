import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, Image, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { advance } from '@react-three/fiber';

const { width } = Dimensions.get('window');
const isFoldScreen = width < 800;
const avatarSize = isFoldScreen ? 65 : 70;

const levelOrder = ['beginner', 'basic', 'advanced', 'elite', 'legendary', 'turhapuro'];

const AvatarContainer = ({ isVisible, onClose, avatars, handleAvatarSelect, playerLevel }) => {

  const tabs = ['Beginner', 'Basic', 'Advanced', 'Elite', 'Legendary'];
  const [selectedTab, setSelectedTab] = useState('Beginner');
  const [showTurhapuroTab, setShowTurhapuroTab] = useState(false);

  const effectivePlayerLevel = (playerLevel || 'beginner').toLowerCase();

  useEffect(() => {
    if (effectivePlayerLevel === 'turhapuro') {
      setShowTurhapuroTab(true);
      setSelectedTab('Beginner');
    } else {
      setShowTurhapuroTab(false);
      setSelectedTab('Beginner');
    }
  }, [effectivePlayerLevel]);

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
          {/*Close button*/}
          <View style={styles.closeButtonContainer}>
            <Pressable style={styles.closeAvatarModalButton} onPress={onClose}>
              <Text style={styles.closeAvatarModalText}>X</Text>
            </Pressable>
          </View>

          {/* Avatar selection */}
          <Text style={styles.avatarSelectText}>Choose your Avatar</Text>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => {
              const isLocked =
                levelOrder.indexOf(effectivePlayerLevel) < levelOrder.indexOf(tab.toLowerCase());
              const isSelected = selectedTab.toLowerCase() === tab.toLowerCase();
              const isBelowPlayerLevel = levelOrder.indexOf(tab.toLowerCase()) <= levelOrder.indexOf(effectivePlayerLevel);

              return (
                <Pressable
                  key={tab}
                  style={[
                    styles.tabButton,
                    isSelected ? styles.activeTabButton : styles.inactiveTabButton,
                    (isLocked || !isBelowPlayerLevel) && styles.lockedTabButton,
                    isBelowPlayerLevel && !isSelected && styles.unlockedTabButton,
                  ]}
                  onPress={() => {
                    if (!isLocked || showTurhapuroTab) {
                      setSelectedTab(tab);
                    }
                  }}
                >
                  <Text style={[styles.tabText, isSelected && styles.activeTabText]}>
                    {tab}
                  </Text>
                  {isLocked && <FontAwesome5 name="lock" size={10} color="gold" style={{ marginLeft: 5 }} />}
                </Pressable>
              );
            })}
          </View>

          {/* Wrap Turhapuro Tab with a View for proper display */}
          {showTurhapuroTab && (
            <View style={styles.turhapuroTabWrapper}>
              <Pressable
                style={[
                  styles.tabButton,
                  selectedTab.toLowerCase() === 'turhapuro'
                    ? styles.activeTabButton
                    : styles.inactiveTabButton,
                ]}
                onPress={() => setSelectedTab('Turhapuro')}
              >
                <Text style={[styles.tabText, selectedTab.toLowerCase() === 'turhapuro' && styles.activeTabText]}>
                  Turhapuro
                </Text>
              </Pressable>
            </View>
          )}

          {/* Avatars */}
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.avatarSelectionWrapper}>
              {filteredAvatars.map((avatar, index) => (
                <Pressable key={index} onPress={() => handleAvatarSelect(avatar)}>
                  <Image
                    style={[
                      styles.avatarModalImage,
                      avatar.level === 'Beginner'
                        ? styles.beginnerAvatar
                        : avatar.level === 'Advanced'
                        ? styles.advancedAvatar
                        : styles.defaultAvatar
                    ]}
                    source={avatar.display}
                  />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  avatarModalBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  avatarModalContainer: {
    width: '80%',
    height: '80%',
    backgroundColor: '#141414',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    position: 'relative',
    flexDirection: 'column',
  },
  avatarSelectText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  closeButtonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    alignItems: 'center',
  },
  closeAvatarModalButton: {
    position: 'absolute',
    right: 5,
    top: 0,
  },
  closeAvatarModalText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: 250,
    flexWrap: 'wrap',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    margin: 5,
    minWidth: 60,
  },
  activeTabButton: {
    backgroundColor: '#62a346',
  },
  inactiveTabButton: {
    backgroundColor: '#405f2b',
  },
  unlockedTabButton: {
    backgroundColor: '#405f2b',
  },
  lockedTabButton: {
    backgroundColor: '#999999',
  },
  tabText: {
    color: '#fff',
    fontSize: 11,
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
    resizeMode: 'cover', // Oletus kaikille avatareille
  },

  // Tyyli Beginner-tason lipuille
  beginnerAvatar: {
    borderRadius: 0,
    width: 50, // Pienennä leveyttä
    height: 35, // Pienennä korkeutta
    resizeMode: 'cover', // Venytä kuva
    margin: 5,
    borderWidth: 1,
    borderColor: '#4f4c4c36',
  },

  advancedAvatar: {
    borderRadius: 0,
  },

  // Tyyli muille avatareille (jotka ovat jo valmiiksi pyöreitä)
  defaultAvatar: {
    borderRadius: avatarSize / 2, // Täysin pyöreä
  },
  turhapuroTabWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 0,
  },
  scrollViewContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
});

export default AvatarContainer;