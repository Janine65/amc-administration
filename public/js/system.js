class system {
    constructor(){
        this.version = this.getVersion();
    }

    /**
    * @return {string} The current version of the package.
    */
    getVersion() {
        console.log('getVersion');
        return require('read-pkg').sync().version;
    }
}

global.system = new system();