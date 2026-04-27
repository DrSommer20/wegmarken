import { Platform } from 'react-native';

// Metro Bundler picks the correct file based on the suffix
// but we provide an explicit export here to fix the broken reference.
import MapComponentNative from './MapComponent.native';
import MapComponentWeb from './MapComponent.web';

const MapComponent = Platform.OS === 'web' ? MapComponentWeb : MapComponentNative;

export default MapComponent;

