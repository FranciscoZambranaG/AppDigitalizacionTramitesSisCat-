import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent llama a AppRegistry.registerComponent('main', () => App)
// y ademas asegura que el entorno este listo tanto en Expo Go como en un build nativo.
registerRootComponent(App);
