const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[meter] MSOE UI', () => {
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
    
    it('should update tempo string', async () => {
        await driver.findElement(By.name('whatistempo')).sendKeys('1/4', Key.ENTER);
        
        expect(await driver.executeScript('return MSOE.getinfo("whatistempo");')).to.equal('1/4');
    });
    
    it('should auto add slash to tempo string if missing (if only two numbers)', async () => {
        await driver.findElement(By.name('whatistempo')).sendKeys('14', Key.ENTER);
        
        expect(await driver.executeScript('return MSOE.getinfo("whatistempo");')).to.equal('1/4');
    });
    
    it('should set tempo string to default (4/4) if input is invalid', async () => {
        await driver.findElement(By.name('whatistempo')).sendKeys('1a4', Key.ENTER);
        
        expect(await driver.executeScript('return MSOE.getinfo("whatistempo");')).to.equal('4/4');
    });
    
    after(async () => driver.quit());
});