const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[meter] MSOE UI', () => {
    const keys = 'ABCDEFG';
    
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
    
    it('should highlight key and insert corresponding note when clicked', async () => {
        const key = helper.randomChoice(keys);
        await driver.findElement(By.id(key)).click();
        var colorChanged = await helper.errorThrownCheck(async () => {
            await driver.wait(async () => {
                return (await driver.findElement(By.id(key)).getCssValue('background-color')) != "rgba(255, 255, 255, 1)";
            }, ANIMATION_TIMEOUT);
        }, 'TimeoutError');
        
        expect(colorChanged).to.be.true;
        expect(await helper.elementAppearsCheck(By.css('path.note.l0.m0.v0'))).to.be.true;
    });
    
    it('should highlight key when a note is inserted', async () => {
        await driver.actions().sendKeys('z').perform();
        
        var colorChanged = await helper.errorThrownCheck(async () => {
            await driver.wait(async () => {
                return (await driver.findElement(By.id('C')).getCssValue('background-color')) != "rgba(255, 255, 255, 1)";
            }, ANIMATION_TIMEOUT);
        }, 'TimeoutError');
        
        expect(colorChanged).to.be.true;
    });
    
    after(async () => driver.quit());
});