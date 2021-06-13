const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { generatePathByIndexKey, Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[unsaved-changes] MSOE UI', () => {
    const helper = new Helper();
    
    const driver = helper.buildDriver();
    
    var home;
    
    before(async () => { // get public ip using shell command
        home = await helper.getHomeAddress();
    });
    
    beforeEach(async () => { // hide modals and enter preview mode
        await helper.goTo();
        await driver.findElement(By.id('infomodal')).click();
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'visible'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('submit')).sendKeys(Key.ENTER);
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'hidden'), ANIMATION_TIMEOUT);
    });
    
    it('should not appear when there are no unsaved changes', async () => {
        await driver.findElement(By.xpath("//*[text()='Save']")).click();
        await driver.wait(async () => {
            return (await driver.getCurrentUrl()) != home;
        }, REDIRECT_TIMEOUT);
        await driver.navigate().refresh();
        await driver.wait(until.elementIsNotVisible(driver.findElement(By.id('preloader'))), PRE_LOADER_TIMEOUT);
        const warnMessage = await helper.checkWarningMessage();
        const buttonShown = await helper.errorThrownCheck(async () => {
            await driver.wait(until.elementIsVisible(
                driver.findElement(By.xpath("//*[text()='Discard Unsaved Changes']"))
            ), ANIMATION_TIMEOUT);
        }, 'TimeoutError');
        
        expect(buttonShown).to.be.false;
        expect(warnMessage).to.equal('');
    });
    
    it('should appear when there are unsaved changes', async () => {
        await driver.findElement(By.xpath("//*[text()='Save']")).click();
        await driver.wait(async () => {
            return (await driver.getCurrentUrl()) != home;
        }, REDIRECT_TIMEOUT);
        await driver.actions().sendKeys('z').perform();
        await driver.navigate().refresh();
        await driver.wait(until.elementIsNotVisible(driver.findElement(By.id('preloader'))), PRE_LOADER_TIMEOUT);
        const warnMessage = await helper.checkWarningMessage();
        const buttonShown = await helper.errorThrownCheck(async () => {
            await driver.wait(until.elementIsVisible(
                driver.findElement(By.xpath("//*[text()='Discard Unsaved Changes']"))
            ), ANIMATION_TIMEOUT);
        }, 'TimeoutError');
        
        expect(buttonShown).to.be.true;
        expect(warnMessage).to.equal('Some unsaved modifications are found.');
    });
    
    it('should clear the unsaved changes and force reloading', async () => {
        await driver.findElement(By.xpath("//*[text()='Save']")).click();
        await driver.wait(async () => {
            return (await driver.getCurrentUrl()) != home;
        }, REDIRECT_TIMEOUT);
        const savedUrl = await driver.getCurrentUrl();
        await driver.actions().sendKeys('z').perform();
        await driver.navigate().refresh();
        await driver.wait(until.elementIsNotVisible(driver.findElement(By.id('preloader'))), PRE_LOADER_TIMEOUT);
        await driver.wait(until.elementIsVisible(
            driver.findElement(By.xpath("//*[text()='Discard Unsaved Changes']"))
        ), ANIMATION_TIMEOUT);
        await driver.findElement(By.xpath("//*[text()='Discard Unsaved Changes']")).click();
        await driver.wait(until.elementIsVisible(driver.findElement(By.css('#discardconfirm>.actions>.ok'))), ANIMATION_TIMEOUT);
        await driver.findElement(By.css('#discardconfirm>.actions>.ok')).click();
        await driver.wait(until.elementIsVisible(driver.findElement(By.css('#forceupdatecheck'))), ANIMATION_TIMEOUT);
        await driver.findElement(By.css('#forceupdatecheck')).click();
        await driver.wait(until.elementIsNotVisible(driver.findElement(By.id('preloader'))), PRE_LOADER_TIMEOUT);
        const currentUrl = await driver.getCurrentUrl();
        const buttonShown = await helper.errorThrownCheck(async () => {
            await driver.wait(until.elementIsVisible(
                driver.findElement(By.xpath("//*[text()='Discard Unsaved Changes']"))
            ), ANIMATION_TIMEOUT);
        }, 'TimeoutError');
        
        expect(currentUrl).to.equal(savedUrl);
        expect(buttonShown).to.be.false;
    });
    
    after(async () => driver.quit());
});