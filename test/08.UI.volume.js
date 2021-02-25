const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[volume] MSOE UI', () => {
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
    
    it('should decrease the volume when volume-down icon is clicked', async () => {
        const currentVolume = parseInt(await driver.findElement(By.css('.volume')).getAttribute('data-percent'), 10);
        await driver.findElement(By.css('.volume-down')).click();
        
        expect(parseInt(await driver.findElement(By.css('.volume')).getAttribute('data-percent'), 10))
            .to.equal(currentVolume - 10);
    });
    
    it('should increase the volume when volume-up icon is clicked', async () => {
        await driver.findElement(By.css('.volume-down')).click();
        await driver.findElement(By.css('.volume-down')).click();
        const currentVolume = parseInt(await driver.findElement(By.css('.volume')).getAttribute('data-percent'), 10);
        await driver.findElement(By.css('.volume-up')).click();
        
        expect(parseInt(await driver.findElement(By.css('.volume')).getAttribute('data-percent'), 10))
            .to.equal(currentVolume + 10);
    });
    
    after(async () => driver.quit());
});