const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { screen, PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT } = require('./constants');

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
        this.home = 'http://127.0.0.1:8080/';
        return this.home;
    }
    
    async goTo(path) {
        path = path || '';
        await this.driver.get(this.home + path);
        await this.driver.wait(until.elementIsNotVisible(this.driver.findElement(By.id('preloader'))), PRE_LOADER_TIMEOUT);
    }
    
    async noSuchErrorThrownCheck(func, errorName) {
        var res = true;
        try {
            await func();
        } catch (e) {
            if (e.name == errorName) {
                res = false;
            } else {
                throw e;
            }
        }
        return res;
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
        return await this.noSuchErrorThrownCheck(async () => {
            await this.driver.findElement(by);
        }, 'NoSuchElementError');
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

    async waitAnimatedShowing(by) {
        await this.driver.wait(this.elementWithState(by, 'visible'), ANIMATION_TIMEOUT);
        await this.driver.wait(this.elementWithoutState(by, 'animating'), ANIMATION_TIMEOUT);
    }
    
    randomIndex(list) {
        return Math.floor(Math.random() * list.length); 
    }
    
    randomItem(list) {
        const index = this.randomIndex(list);
        return [index, list[index]];
    }
    
    randomChoice(list) {
        return list[this.randomIndex(list)];
    }
    
    async checkMessage(id_) {
        var message = '';
        const messageDiv = await this.driver.findElement(By.id(id_));
        try {
            await this.driver.wait(async () => {
                const shown = messageDiv.isDisplayed();
                if (shown) {
                    message = await messageDiv.findElement(By.xpath('p')).getText();
                }
                return shown;
            }, ANIMATION_TIMEOUT);
        } catch (e) {
            if (e.name != 'TimeoutError') {
                throw e;
            }
        }
        return message;
    }
    
    async checkErrorMessage() { return await this.checkMessage('error'); }
    async checkSuccessMessage() { return await this.checkMessage('success'); }
    async checkWarningMessage() { return await this.checkMessage('warning'); }
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