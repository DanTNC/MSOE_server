const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { defaultIndex, generatePathByIndexKey, Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[authorization] MSOE UI', () => {
    const helper = new Helper();
    
    const driver = helper.buildDriver();
    
    var home;
    
    before(async () => { // get public ip using shell command
        home = await helper.getHomeAddress();
    });
    
    it('should enter view-only mode if the sheet key is not provided', async () => {
        await helper.goTo(generatePathByIndexKey(false, defaultIndex));
        const inputs = await driver.findElements(By.xpath('//input[parent::*[@id!="save_url" or not(@id)]]'));
        for (let input of inputs) {
            expect(await input.getAttribute('disabled')).to.equal('true');
        }
        
        const leftItems = await driver.findElements(By.css('.left>.menu a.item'));
        for (let leftItem of leftItems) {
            expect((await leftItem.getAttribute('class')).includes('disabled')).to.be.true;
        }
    });
    
    after(async () => driver.quit());
});