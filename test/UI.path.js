const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { defaultIndex, defaultKey, generatePathByIndexKey } = require('./helper');
const { screen, PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[path] MSOE UI', () => {
    const driver = new Builder()
                    .forBrowser('chrome')
                    .setChromeOptions(new chrome.Options().headless().windowSize(screen))
                    .build();
                    
    const modalStateCheck = async (id_, state) => {
        return (await driver.findElement(By.id(id_)).getAttribute('class')).includes(state);
    };
    
    const modalState = (id_, state) => {
        return async () => {
            return await modalStateCheck(id_, state);
        };
    };
    
    const goTo = async (path) => {
        path = path || '';
        await driver.get(home + path);
        await driver.wait(until.elementIsNotVisible(driver.findElement(By.id('preloader'))), PRE_LOADER_TIMEOUT);
    };
    
    var home;
    
    before(async () => { // get public ip using shell command
        const { stdout, stderr } = await exec("curl -s http://169.254.169.254/latest/meta-data/public-ipv4");
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        home = 'http://' + stdout + ':8080/';
        console.log(home);
    });
    
    it('should show loading screen before all documents are ready', async () => {
        await driver.get(home);
        const preloader = await driver.findElement(By.id('preloader'));
        
        expect(await preloader.isDisplayed()).to.be.true;
    });
    
    it('should show welcome modal when user enters homepage', async () => {
        await goTo();
        
        expect(await modalStateCheck('modaldiv1', 'visible')).to.be.true;
    });
    
    it('should not show welcome modal when user enters a sheetpage', async () => {
        await goTo(generatePathByIndexKey(true));
        
        expect(await modalStateCheck('modaldiv1', 'visible')).to.be.false;
    });
    
    it('should show info modal when user clicks the start button in welcome modal', async () => {
        await goTo();
        await driver.findElement(By.id('infomodal')).click();
        await driver.wait(modalState('modaldiv1', 'hidden'), ANIMATION_TIMEOUT);
        var modalAppears = true;
        try {
            await driver.wait(modalState('modaldiv2', 'visible'), ANIMATION_TIMEOUT);
        } catch (TimeoutException) {
            modalAppears = false;
        }
        
        expect(modalAppears).to.be.true;
    });

    it('should go back to homepage when the logo is clicked', async () => {
        await goTo();
        await driver.findElement(By.id('infomodal')).click();
        await driver.wait(modalState('modaldiv2', 'visible'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('submit')).sendKeys(Key.ENTER);
        await driver.wait(modalState('modaldiv2', 'hidden'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('logo')).click();
        await driver.wait(until.elementIsVisible(driver.findElement(By.id('preloader'))), PRE_LOADER_TIMEOUT);

        expect(await driver.getCurrentUrl()).to.equal(home);
    });
    
    it('should redirect to homepage if the sheet index is invalid', async () => {
        const invalidIndex = defaultIndex.substr(1);
        await driver.get(home + generatePathByIndexKey(false, invalidIndex));
        var redirected = true;
        try {
            await driver.wait(async () => {
                return (await driver.getCurrentUrl()) == home;
            }, REDIRECT_TIMEOUT);
        } catch (TimeoutException) {
            redirected = false;
        }
        
        expect(redirected).to.be.true;
    });
    
    it('should redirect to view-only mode if the sheet key is incorrect', async () => {
        const invalidKey = defaultKey.substr(1);
        await driver.get(home + generatePathByIndexKey(true, defaultIndex, invalidKey));
        var redirected = true;
        try {
            await driver.wait(async () => {
                return (await driver.getCurrentUrl()) == home + generatePathByIndexKey(false, defaultIndex);
            }, REDIRECT_TIMEOUT);
        } catch (TimeoutException) {
            redirected = false;
        }
        
        expect(redirected).to.be.true;
    });
    
    after(async () => driver.quit());
});