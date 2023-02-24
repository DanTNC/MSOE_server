const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const {  Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT, screen } = require('./constants');

describe('[manual] MSOE UI', () => {
    const helper = new Helper();
    
    const driver = helper.buildDriver();
    
    var home;
    var firstWindow;
    
    before(async () => { // get public ip using shell command
        home = await helper.getHomeAddress();
    });
    
    beforeEach(async () => { // hide modals and enter preview mode
        firstWindow = (await driver.getAllWindowHandles())[0];
        await helper.goTo();
        await driver.findElement(By.id('infomodal')).click();
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'visible'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('submit')).sendKeys(Key.ENTER);
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'hidden'), ANIMATION_TIMEOUT);
        await driver.findElement(By.xpath('//*[text()="Manual"]')).click();
        await helper.waitAnimatedShowing(By.id('sidebar'));
    });
    
    it('should change font size when font-size button is clicked', async () => {
        const currentFontSize = await driver.findElement(By.css('p.manual')).getCssValue('font-size');
        var currentNotActiveButton = await driver.findElement(By.css('button.font:not(.active)'));
        await driver.wait(until.elementIsVisible(currentNotActiveButton));
        await currentNotActiveButton.click();
        
        expect(await driver.findElement(By.css('p.manual')).getCssValue('font-size')).to.not.equal(currentFontSize);
        
        currentNotActiveButton = await driver.findElement(By.css('button.font:not(.active)'));
        await currentNotActiveButton.click();
        
        expect(await driver.findElement(By.css('p.manual')).getCssValue('font-size')).to.equal(currentFontSize);
    });
    
    it('should expand the manual when double left angle button is clicked', async () => {
        const widenIcon = await driver.findElement(By.css('#manual_window>i.angle.double.left.icon'));
        await driver.wait(until.elementIsVisible(widenIcon));
        await widenIcon.click();
        const manualWiden = await helper.noSuchErrorThrownCheck(async () => {
            await driver.wait(async () => {
                return (await driver.findElement(By.id('sidebar')).getCssValue('width')) == `${screen.width}px`;
            }, ANIMATION_TIMEOUT);
        }, 'TimeoutError');
        
        expect(manualWiden).to.be.true;
    });
    
    it('should reset the manual width when double right angle button is clicked', async () => {
        const defaultWidth = await driver.findElement(By.id('sidebar')).getCssValue('width');
        const widenIcon = await driver.findElement(By.css('#manual_window>i.angle.double.left.icon'));
        await driver.wait(until.elementIsVisible(widenIcon));
        await widenIcon.click();
        await driver.wait(async () => {
            return (await driver.findElement(By.id('sidebar')).getCssValue('width')) == '1024px';
        }, ANIMATION_TIMEOUT);
        const narrowenIconBy = By.css('#manual_window>i.angle.double.right.icon');
        await driver.wait(helper.elementAppears(narrowenIconBy));
        await driver.findElement(narrowenIconBy).click();
        const manualNarrowen = await helper.noSuchErrorThrownCheck(async () => {
            await driver.wait(async () => {
                return (await driver.findElement(By.id('sidebar')).getCssValue('width')) == defaultWidth;
            }, ANIMATION_TIMEOUT);
        }, 'TimeoutError');
        
        expect(manualNarrowen).to.be.true;
    });
    
    it('should open a new window showing the manual when open new icon is clicked', async () => {
        const newIcon = await driver.findElement(By.css('#manual_window>i.external.square.icon'));
        await driver.wait(until.elementIsVisible(newIcon));
        await newIcon.click();
        await driver.wait(async () => {
            return (await driver.getAllWindowHandles()).length == 2;
        }, REDIRECT_TIMEOUT);
        await driver.switchTo().window((await driver.getAllWindowHandles())[1]);
        
        expect(await driver.getCurrentUrl()).to.equal(home + 'manual');
    });
    
    it('should open a new window showing the keyboard manual when keyboard icon is clicked', async () => {
        const kbIcon = await driver.findElement(By.css('#manual_window>i.keyboard.icon'));
        await driver.wait(until.elementIsVisible(kbIcon));
        await kbIcon.click();
        await driver.wait(async () => {
            return (await driver.getAllWindowHandles()).length == 2;
        }, REDIRECT_TIMEOUT);
        await driver.switchTo().window((await driver.getAllWindowHandles())[1]);
        
        expect(await driver.getCurrentUrl()).to.equal(home + 'manual_keyboard');
    });
    
    afterEach(async () => {
        const handles = await driver.getAllWindowHandles();
        for (let handle of handles) {
            if (handle != firstWindow) {
                await driver.switchTo().window(handle);
                await driver.close();
            }
        }
        await driver.switchTo().window(firstWindow);
    });
    
    after(async () => driver.quit());
});