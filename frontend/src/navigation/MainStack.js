import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatListScreen from '../screens/Home/ChatList/ChatListScreen';
import ChatRoomScreen from '../screens/Home/ChatRoom/ChatRoomScreen';
import SearchScreen from '../screens/Home/Search/SearchScreen';
import ProfileScreen from '../screens/Home/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Home/EditProfile/EditProfileScreen';
import { SCREENS } from '../constants';

const Stack = createNativeStackNavigator();

/**
 * Main app navigation stack.
 * Contains all authenticated screens.
 */
const MainStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={SCREENS.CHAT_LIST}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name={SCREENS.CHAT_LIST} component={ChatListScreen} />
      <Stack.Screen name={SCREENS.CHAT_ROOM} component={ChatRoomScreen} />
      <Stack.Screen name={SCREENS.SEARCH} component={SearchScreen} />
      <Stack.Screen name={SCREENS.PROFILE} component={ProfileScreen} />
      <Stack.Screen name={SCREENS.EDIT_PROFILE} component={EditProfileScreen} />
    </Stack.Navigator>
  );
};

export default MainStack;
