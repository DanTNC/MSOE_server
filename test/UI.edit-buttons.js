const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { generatePathByIndexKey } = require('./helper');
const { screen, PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[edit-buttons] MSOE UI', () => {
    const driver = new Builder()
                    .forBrowser('chrome')
                    .setChromeOptions(new chrome.Options().headless().windowSize(screen))
                    .build();
    
    const elementWithStateCheck = async (id_, state) => {
        return (await driver.findElement(By.id(id_)).getAttribute('class')).includes(state);
    };
    
    const elementWithoutStateCheck = async (id_, state) => {
        return !(await elementWithStateCheck(id_, state));
    };
    
    const elementWithState = (id_, state) => {
        return async () => {
            return await elementWithStateCheck(id_, state);
        };
    };
    
    const elementWithoutState = (id_, state) => {
        return async () => {
            return await elementWithoutStateCheck(id_, state);
        };
    };
    
    const elementDisappear = (by) => {
        return async () => {
            var disappear = false;
            try {
                await driver.findElement(by);
            } catch (NoSuchElementError) {
                disappear = true;
            }
            return disappear;
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
    });
    
    beforeEach(async () => { // hide modals
        await goTo();
        await driver.findElement(By.id('infomodal')).click();
        await driver.wait(elementWithState('modaldiv2', 'visible'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('submit')).sendKeys(Key.ENTER);
        await driver.wait(elementWithState('modaldiv2', 'hidden'), ANIMATION_TIMEOUT);
    });
    
    describe('[Manual]', () => {
        it('should show manual when [Manual] is clicked', async () => {
            await driver.findElement(By.xpath("//*[text()='Manual']")).click();
            var manualShown = true;
            try {
                await driver.wait(elementWithState('sidebar', 'visible'), ANIMATION_TIMEOUT);
            } catch (TimeoutException) {
                manualShown = false;
            }
            
            expect(manualShown).to.be.true;
        });
        
        it('should hide manual when dimmer is clicked while manual is shown', async () => {
            await driver.findElement(By.xpath("//*[text()='Manual']")).click();
            await driver.findElement(By.xpath("//*[@class='pusher dimmed']")).click();
            var manualShown = true;
            try {
                await driver.wait(elementWithoutState('sidebar', 'visible'), ANIMATION_TIMEOUT);
            } catch (TimeoutException) {
                manualShown = false;
            }
            
            expect(manualShown).to.be.true;
        });    
    });
    
    
    describe('[Help]', () => {
        it('should show popup messages for [Help] when it\'s hovered', async () => {
            const helpButton = await driver.findElement(By.xpath("//*[text()='Help']"));
            await driver.actions().move({x: 0, y: 0, origin: helpButton}).perform();
            var found = true;
            try {
                await driver.findElement(By.xpath("//*[contains(@class, 'popup')]"));
            } catch (NoSuchElementError) {
                found = false;
            }
            
            expect(found).to.be.true;
        });
        
        it('should show popup messages for buttons with help after [Help] is clicked', async () => {
            await driver.findElement(By.xpath("//*[text()='Help']")).click();
            const buttonWithHelp = await driver.findElement(By.xpath("//*[contains(@class, 'help')][1]"));
            await driver.actions().move({x: 0, y: 0, origin: buttonWithHelp}).perform();
            var found = true;
            try {
                await driver.findElement(By.xpath("//*[contains(@class, 'popup')]"));
            } catch (NoSuchElementError) {
                found = false;
            }
            
            expect(found).to.be.true;
        });
        
        it('should toggle display of popup messages when [Help] is clicked', async () => {
            const helpButton = await driver.findElement(By.xpath("//*[text()='Help']"));
            const offColor = await driver.executeScript('return getComputedStyle(arguments[0]).getPropertyValue("color");', helpButton);
            await helpButton.click();
            var colorChanged = true;
            try {
                await driver.wait(async () => {
                    const color = await driver.executeScript('return getComputedStyle(arguments[0]).getPropertyValue("color");', helpButton);
                    return color != offColor;
                }, ANIMATION_TIMEOUT);
            } catch (TimeoutException) {
                colorChanged = false;
            }
            
            expect(colorChanged).to.be.true;
            
            await helpButton.click();
            
            const buttonWithHelp = await driver.findElement(By.xpath("//*[contains(@class, 'help')][1]"));
            await driver.actions().move({x: 0, y: 0, origin: buttonWithHelp}).perform();
            var popupDisappears = true;
            try {
                await driver.wait(elementDisappear(By.xpath("//*[contains(@class, 'popup')]")), ANIMATION_TIMEOUT);
            } catch (TimeoutException) {
                popupDisappears = false;
            }
            
            expect(popupDisappears).to.be.true;
        });
    });
    
    after(async () => driver.quit());
});