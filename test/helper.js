const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { screen, PRE_LOADER_TIMEOUT } = require('./constants');

const buildDriver = () => {
    return new Builder()
            .forBrowser('chrome')
            .setChromeOptions(new chrome.Options().headless().windowSize(screen))
            .build();
};
    
const goTo = async (driver, home, path) => {
    path = path || '';
    await driver.get(home + path);
    await driver.wait(until.elementIsNotVisible(driver.findElement(By.id('preloader'))), PRE_LOADER_TIMEOUT);
};

const getHomeAddress = async () => {
    const { stdout, stderr } = await exec("curl -s http://169.254.169.254/latest/meta-data/public-ipv4");
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    return 'http://' + stdout + ':8080/';
};

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

const elementWithStateCheck = async (driver, by, state) => {
    return (await driver.findElement(by).getAttribute('class')).includes(state);
};

const elementWithoutStateCheck = async (driver, by, state) => {
    return !(await elementWithStateCheck(driver, by, state));
};

const elementWithState = (driver, by, state) => {
    return async () => {
        return await elementWithStateCheck(driver, by, state);
    };
};

const elementWithoutState = (driver, by, state) => {
    return async () => {
        return await elementWithoutStateCheck(driver, by, state);
    };
};

const elementAppearsCheck = async (driver, by) => {
    var appears = true;
    try {
        await driver.findElement(by);
    } catch (e) {
        if (e.name == 'NoSuchElementError') {
            appears = false;
        } else {
            throw e;
        }
    }
    return appears;
};

const elementDisappearsCheck = async (driver, by) => {
    return !(await elementAppearsCheck(driver, by));
};

const elementAppears = (driver, by) => {
    return async () => {
        return await elementAppearsCheck(driver, by);
    };
};

const elementDisappears = (driver, by) => {
    return async () => {
        return await elementDisappearsCheck(driver, by);
    };
};

module.exports = {
    buildDriver,
    goTo,
    getHomeAddress,
    defaultIndex,
    defaultKey,
    generatePathByIndexKey,
    elementWithState,
    elementWithStateCheck,
    elementWithoutState,
    elementWithoutStateCheck,
    elementAppears,
    elementAppearsCheck,
    elementDisappears,
    elementDisappearsCheck,
};