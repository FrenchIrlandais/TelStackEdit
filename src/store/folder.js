import storeFactory from './storeFactory';
import folderInfoSvc from '../services/folderInfoSvc';

const mod = storeFactory(folderInfoSvc.emptyFolderInfoConstructor);

// TODO rename folderInfo !!!!

export default mod;
