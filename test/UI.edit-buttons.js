const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { elementWithState, elementWithoutState, elementDisappears, elementAppears } = require('./helper');
const { screen, PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[edit-buttons] MSOE UI', () => {
    const driver = new Builder()
                    .forBrowser('chrome')
                    .setChromeOptions(new chrome.Options().headless().windowSize(screen))
                    .build();
    
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
        await driver.wait(elementWithState(driver, By.id('modaldiv2'), 'visible'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('submit')).sendKeys(Key.ENTER);
        await driver.wait(elementWithState(driver, By.id('modaldiv2'), 'hidden'), ANIMATION_TIMEOUT);
    });
    
    describe('[Manual]', () => {
        it('should show manual', async () => {
            await driver.findElement(By.xpath("//*[text()='Manual']")).click();
            var manualShown = true;
            try {
                await driver.wait(elementWithState(driver, By.id('sidebar'), 'visible'), ANIMATION_TIMEOUT);
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
                await driver.wait(elementWithoutState(driver, By.id('sidebar'), 'visible'), ANIMATION_TIMEOUT);
            } catch (TimeoutException) {
                manualShown = false;
            }
            
            expect(manualShown).to.be.true;
        });    
    });
    
    
    describe('[Help]', () => {
        it('should show popup messages when hovered', async () => {
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
        
        it('should show popup messages for buttons with help', async () => {
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
        
        it('should toggle display of popup messages', async () => {
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
            
            expect(colorChanged, "color of button should change").to.be.true;
            
            await helpButton.click();
            
            const buttonWithHelp = await driver.findElement(By.xpath("//*[contains(@class, 'help')][1]"));
            await driver.actions().move({x: 0, y: 0, origin: buttonWithHelp}).perform();
            var popupDisappears = true;
            try {
                await driver.wait(elementDisappears(driver, By.xpath("//*[contains(@class, 'popup')]")), ANIMATION_TIMEOUT);
            } catch (TimeoutException) {
                popupDisappears = false;
            }
            
            expect(popupDisappears).to.be.true;
        });
    });
    
    describe('[Save]', () => {
        it('should generate a index-key pair and append it to the url', async () => {
            await driver.findElement(By.xpath("//*[text()='Save']")).click();
            var urlChanged = true;
            try {
                await driver.wait(async () => {
                    return (await driver.getCurrentUrl()) != home;
                }, REDIRECT_TIMEOUT);
            } catch (TimeoutException) {
                urlChanged = false;
            }
            expect(urlChanged).to.be.true;
        });
        
        it('should save sheet in database', async () => {
            await driver.actions().sendKeys("z").perform();
            await driver.wait(until.elementLocated(By.xpath('//*[local-name()="path"and@class="note l0 m0 v0"]')), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath("//*[text()='Save']")).click();
            await driver.wait(async () => {
                return (await driver.getCurrentUrl()) != home;
            }, REDIRECT_TIMEOUT);
            await driver.navigate().refresh();
            await driver.wait(until.elementIsNotVisible(driver.findElement(By.id('preloader'))), PRE_LOADER_TIMEOUT);
            var noteAppears = true;
            try {
                await driver.wait(elementAppears(driver, By.xpath('//*[local-name()="path"and@class="note l0 m0 v0"]')), ANIMATION_TIMEOUT);
            } catch (TimeoutException) {
                noteAppears = false;
            }
            
            expect(noteAppears).to.be.true;
        });
    });
    
    describe('[Toolbox]', () => {
        it('should show sidebar toolbox', async () => {
            await driver.findElement(By.xpath("//*[text()='Toolbox']")).click();
            var toolboxShown = true;
            try {
                await driver.wait(elementWithState(driver, By.id('toolbox'), 'visible'), ANIMATION_TIMEOUT);
            } catch (TimeoutException) {
                toolboxShown = false;
            }
            
            expect(toolboxShown).to.be.true;
        });
        
        it('should toggle display of sidebar toolbox', async () => {
            const toolboxButton = await driver.findElement(By.xpath("//*[text()='Toolbox']"));
            const offColor = await driver.executeScript('return getComputedStyle(arguments[0]).getPropertyValue("color");', toolboxButton);
            await toolboxButton.click();
            var colorChanged = true;
            try {
                await driver.wait(async () => {
                    const color = await driver.executeScript('return getComputedStyle(arguments[0]).getPropertyValue("color");', toolboxButton);
                    return color != offColor;
                }, ANIMATION_TIMEOUT);
            } catch (TimeoutException) {
                colorChanged = false;
            }
            
            expect(colorChanged, "color of button should change").to.be.true;
            
            await toolboxButton.click();
            
            var toolboxHidden = true;
            try {
                await driver.wait(elementWithoutState(driver, By.id('toolbox'), 'visible'), ANIMATION_TIMEOUT);
            } catch (TimeoutException) {
                toolboxHidden = false;
            }
            
            expect(toolboxHidden).to.be.true;
        });
    });
    
    describe('[QR Code]', () => {
        it('should show warning message when the sheet is not saved', async () => {
            await driver.findElement(By.xpath("//*[text()='QR Code']")).click();
            var QRWarnShown = true;
            try {
                await driver.wait(elementAppears(driver, By.xpath('//*[text()="You need to save the sheet before generating QR code."]')), ANIMATION_TIMEOUT);
            } catch (TimeoutException) {
                QRWarnShown = false;
            }
            
            expect(QRWarnShown).to.be.true;
        });
        
        it('should show the QR code to the current page when sheet already saved', async () => {
            await driver.findElement(By.xpath("//*[text()='Save']")).click();
            await driver.wait(async () => {return (await driver.getCurrentUrl()) != home;}, REDIRECT_TIMEOUT);
            await driver.findElement(By.xpath("//*[text()='QR Code']")).click();
            await driver.wait(elementWithState(driver, By.id('modalQR'), 'visible'), ANIMATION_TIMEOUT);
            
            expect(await driver.findElement(By.xpath("//*[text()='Here is the QR code of this sheet:']")).isDisplayed()).to.be.true;
            expect(await driver.findElement(By.xpath("//*[@alt='Scan me!']")).isDisplayed()).to.be.true;
            expect(await driver.findElement(By.xpath("//*[text()='Download']")).isDisplayed()).to.be.true;
        });
    });
    
    after(async () => driver.quit());
});