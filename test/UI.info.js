const { By, Key } = require('selenium-webdriver');
const { expect } = require('chai');
const { Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[info] MSOE UI', () => {
    const fields = [
        "whoiseditor",
        "whoiscomposer",
        "whatistitle",
        "whatissubtitle",
        "whichalbum",
        "whoisartist",
    ];
    
    const helper = new Helper();
    
    const driver = helper.buildDriver();
    
    var home;
    
    before(async () => { // get public ip using shell command
        home = await helper.getHomeAddress();
    });
    
    beforeEach(async () => { // go to info modal
        await helper.goTo();
        await driver.findElement(By.id('infomodal')).click();
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'visible'), ANIMATION_TIMEOUT);
    });
    
    it('should show all info fields', async () => {
        for (let field of fields) {
            expect(await (driver.findElement(By.name(field))).isDisplayed()).to.be.true;
        }
    });
    
    it('should keep the inputted value after modal being closed', async () => {
        const field_index = Math.floor(Math.random() * fields.length);
        const field = fields[field_index];
        const input_field = await driver.findElement(By.name(field));
        await input_field.sendKeys("test");
        await driver.findElement(By.id('submit')).click();
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'hidden'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('infohome')).click();
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'visible'), ANIMATION_TIMEOUT);
        
        expect(await (driver.findElement(By.name(field))).getAttribute("value")).to.equal("test");
    });
    
    it('should restore previous value when [undo] is fired by user', async () => {
        const field_index = Math.floor(Math.random() * fields.length);
        const field = fields[field_index];
        const input_field = await driver.findElement(By.name(field));
        await input_field.sendKeys("test");
        await driver.findElement(By.id('submit')).click();
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'hidden'), ANIMATION_TIMEOUT);
        await driver.actions().keyDown(Key.CONTROL).sendKeys('z').keyUp(Key.CONTROL).perform();
        await driver.findElement(By.id('infohome')).click();
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'visible'), ANIMATION_TIMEOUT);
        
        expect(await (driver.findElement(By.name(field))).getAttribute("value")).to.equal("");
    });
    
    after(async () => driver.quit());
});