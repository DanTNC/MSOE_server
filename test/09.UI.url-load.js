const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { generatePathByIndexKey, Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[url-load] MSOE UI', () => {
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
    
    it('should not show anything if the sheet is not saved', async () => {
        expect(await driver.findElement(By.css('#save_url>input')).getAttribute('value')).to.equal('');
    });
    
    it('should show current url of a saved sheet on saving', async () => {
        await driver.findElement(By.xpath("//*[text()='Save']")).click();
        await driver.wait(async () => {
            return (await driver.getCurrentUrl()) != home;
        }, REDIRECT_TIMEOUT);
        const currentUrl = (await driver.getCurrentUrl());
        
        expect(home + await driver.findElement(By.css('#save_url>input')).getAttribute('value')).to.equal(currentUrl);
    });
    
    it('should show current url of a saved sheet', async () => {
        await helper.goTo(generatePathByIndexKey(true));
        
        expect(await driver.findElement(By.css('#save_url>input')).getAttribute('value')).to.equal(generatePathByIndexKey(true));
    });
    
    it('should jump to the inputted url while [load] button is clicked', async () => {
        await driver.findElement(By.css('#save_url>input')).sendKeys(generatePathByIndexKey(true));
        await driver.findElement(By.xpath("//*[text()='Load']")).click();
        await driver.wait(async () => {
            return (await driver.getCurrentUrl()) != home;
        }, REDIRECT_TIMEOUT);
        const currentUrl = (await driver.getCurrentUrl());
        
        expect(currentUrl).to.equal(home + generatePathByIndexKey(true));
    });
    
    after(async () => driver.quit());
});