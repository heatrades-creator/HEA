import { View, ActivityIndicator } from 'react-native'

// Root index — shown briefly before _layout.tsx redirects based on auth state.
// Without this file Expo Router shows "Unmatched Route" for the heainstaller:/// URL.
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#ffd100" />
    </View>
  )
}
