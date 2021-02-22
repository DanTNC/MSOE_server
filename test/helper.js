const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { screen, PRE_LOADER_TIMEOUT } = require('./constants');

class Helper {
    buildDriver(extra_options) {
        extra_options = extra_options || ((options) => {return options});
        this.driver = new Builder()
            .forBrowser('chrome')
            .setChromeOptions(extra_options(new chrome.Options().headless().windowSize(screen)))
            .build();
        return this.driver;
    }
    
    async getHomeAddress() {
        const { stdout, stderr } = await exec("curl -s http://169.254.169.254/latest/meta-data/public-ipv4");
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        this.home = 'http://' + stdout + ':8080/';
        return this.home;
    }
    
    async goTo(path) {
        path = path || '';
        await this.driver.get(this.home + path);
        await this.driver.wait(until.elementIsNotVisible(this.driver.findElement(By.id('preloader'))), PRE_LOADER_TIMEOUT);
    }
    
    async elementWithStateCheck(by, state) {
        return (await this.driver.findElement(by).getAttribute('class')).includes(state);
    }
    
    async elementWithoutStateCheck(by, state) {
        return !(await this.elementWithStateCheck(by, state));
    }
    
    elementWithState(by, state) {
        return async () => {
            return await this.elementWithStateCheck(by, state);
        };
    }
    
    elementWithoutState(by, state) {
        return async () => {
            return await this.elementWithoutStateCheck(by, state);
        };
    }
    
    async elementAppearsCheck(by) {
        var appears = true;
        try {
            await this.driver.findElement(by);
        } catch (e) {
            if (e.name == 'NoSuchElementError') {
                appears = false;
            } else {
                throw e;
            }
        }
        return appears;
    }
    
    async elementDisappearsCheck(by) {
        return !(await this.elementAppearsCheck(by));
    }
    
    elementAppears(by) {
        return async () => {
            return await this.elementAppearsCheck(by);
        };
    }
    
    elementDisappears(by) {
        return async () => {
            return await this.elementDisappearsCheck(by);
        };
    }
}

const defaultIndex = 'WPR21F2BZT';
const defaultKey = 'FTBT+6SPTLB7BNCYJEYZ';

const generatePathByIndexKey = (editMode, index, key) => {
    index = index || defaultIndex;
    if (editMode) {
        key = key || defaultKey;
        key = '!' + key;
    } else {
        key = '';
    }
    return '?!' + index + key;
};

const deleteDir = (fs, path, dir) => {
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (let file of files) {
            fs.unlinkSync(path.resolve(dir, file));
        }
        fs.rmdirSync(dir);
    }
};

module.exports = {
    Helper,
    defaultIndex,
    defaultKey,
    generatePathByIndexKey,
    deleteDir,
};