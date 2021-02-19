const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { 
    defaultIndex, defaultKey, generatePathByIndexKey,
    elementWithState, elementWithStateCheck,
    buildDriver, goTo, getHomeAddress
} = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[path] MSOE UI', () => {
    const driver = buildDriver();
    
    var home;
    
    before(async () => { // get public ip using shell command
        home = await getHomeAddress();
    });
    
    it('should show loading screen before all documents are ready', async () => {
        await driver.get(home);
        const preloader = await driver.findElement(By.id('preloader'));
        
        expect(await preloader.isDisplayed()).to.be.true;
    });
    
    it('should show welcome modal when user enters homepage', async () => {
        await goTo(driver, home);
        
        expect(await elementWithStateCheck(driver, By.id('modaldiv1'), 'visible')).to.be.true;
    });
    
    it('should not show welcome modal when user enters a sheetpage', async () => {
        await goTo(driver, home, generatePathByIndexKey(true));
        
        expect(await elementWithStateCheck(driver, By.id('modaldiv1'), 'visible')).to.be.false;
    });
    
    it('should show info modal when user clicks the start button in welcome modal', async () => {
        await goTo(driver, home);
        await driver.findElement(By.id('infomodal')).click();
        await driver.wait(elementWithState(driver, By.id('modaldiv1'), 'hidden'), ANIMATION_TIMEOUT);
        var modalAppears = true;
        try {
            await driver.wait(elementWithState(driver, By.id('modaldiv2'), 'visible'), ANIMATION_TIMEOUT);
        } catch (e) {
            if (e.name == 'TimeoutException') {
                modalAppears = false;
            } else {
                throw e;
            }
        }
        
        expect(modalAppears).to.be.true;
    });

    it('should go back to homepage when the logo is clicked', async () => {
        await goTo(driver, home);
        await driver.findElement(By.id('infomodal')).click();
        await driver.wait(elementWithState(driver, By.id('modaldiv2'), 'visible'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('submit')).sendKeys(Key.ENTER);
        await driver.wait(elementWithState(driver, By.id('modaldiv2'), 'hidden'), ANIMATION_TIMEOUT);
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
        } catch (e) {
            if (e.name == 'TimeoutException') {
                redirected = false;
            } else {
                throw e;
            }
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
        } catch (e) {
            if (e.name == 'TimeoutException') {
                redirected = false;
            } else {
                throw e;
            }
        }
        
        expect(redirected).to.be.true;
    });
    
    after(async () => driver.quit());
});