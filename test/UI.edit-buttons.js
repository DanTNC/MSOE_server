const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[edit-buttons] MSOE UI', () => {
    const helper = new Helper();
    
    const driver = helper.buildDriver();
    
    var home;
    
    before(async () => { // get public ip using shell command
        home = await helper.getHomeAddress();
    });
    
    beforeEach(async () => { // hide modals
        await helper.goTo();
        await driver.findElement(By.id('infomodal')).click();
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'visible'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('submit')).sendKeys(Key.ENTER);
        await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'hidden'), ANIMATION_TIMEOUT);
    });
    
    describe('[Manual]', () => {
        it('should show manual', async () => {
            await driver.findElement(By.xpath("//*[text()='Manual']")).click();
            var manualShown = true;
            try {
                await driver.wait(helper.elementWithState(By.id('sidebar'), 'visible'), ANIMATION_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	manualShown = false;
                } else {
                	throw e;
                }
            }
            
            expect(manualShown).to.be.true;
        });
        
        it('should hide manual when dimmer is clicked while manual is shown', async () => {
            await driver.findElement(By.xpath("//*[text()='Manual']")).click();
            await driver.findElement(By.css(".pusher.dimmed")).click();
            var manualShown = true;
            try {
                await driver.wait(helper.elementWithoutState(By.id('sidebar'), 'visible'), ANIMATION_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	manualShown = false;
                } else {
                	throw e;
                }
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
                // await driver.findElement(By.xpath("//*[contains(@class, 'popup')]"));
                await driver.findElement(By.css(".popup"));
            } catch (e) {
                if (e.name == 'NoSuchElementError') {
                	found = false;
                } else {
                	throw e;
                }
            }
            
            expect(found).to.be.true;
        });
        
        it('should show popup messages for buttons with help', async () => {
            await driver.findElement(By.xpath("//*[text()='Help']")).click();
            const buttonWithHelp = await driver.findElement(By.xpath("//*[contains(@class, 'help')][1]"));
            await driver.actions().move({x: 0, y: 0, origin: buttonWithHelp}).perform();
            var found = true;
            try {
                await driver.findElement(By.css(".popup"));
            } catch (e) {
                if (e.name == 'NoSuchElementError') {
                	found = false;
                } else {
                	throw e;
                }
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
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	colorChanged = false;
                } else {
                	throw e;
                }
            }
            
            expect(colorChanged, "color of button should change").to.be.true;
            
            await helpButton.click();
            
            const buttonWithHelp = await driver.findElement(By.xpath("//*[contains(@class, 'help')][1]"));
            await driver.actions().move({x: 0, y: 0, origin: buttonWithHelp}).perform();
            var popupDisappears = true;
            try {
                await driver.wait(helper.elementDisappears(By.css(".popup")), ANIMATION_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	popupDisappears = false;
                } else {
                	throw e;
                }
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
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	urlChanged = false;
                } else {
                	throw e;
                }
            }
            expect(urlChanged).to.be.true;
        });
        
        it('should save sheet in database', async () => {
            await driver.actions().sendKeys("z").perform();
            await driver.wait(until.elementLocated(By.css('path.note.l0.m0.v0')), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath("//*[text()='Save']")).click();
            await driver.wait(async () => {
                return (await driver.getCurrentUrl()) != home;
            }, REDIRECT_TIMEOUT);
            await driver.navigate().refresh();
            await driver.wait(until.elementIsNotVisible(driver.findElement(By.id('preloader'))), PRE_LOADER_TIMEOUT);
            var noteAppears = true;
            try {
                await driver.wait(helper.elementAppears(By.css('path.note.l0.m0.v0')), ANIMATION_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	noteAppears = false;
                } else {
                	throw e;
                }
            }
            
            expect(noteAppears).to.be.true;
        });
    });
    
    describe('[Toolbox]', () => {
        it('should show sidebar toolbox', async () => {
            await driver.findElement(By.xpath("//*[text()='Toolbox']")).click();
            var toolboxShown = true;
            try {
                await driver.wait(helper.elementWithState(By.id('toolbox'), 'visible'), ANIMATION_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	toolboxShown = false;
                } else {
                	throw e;
                }
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
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	colorChanged = false;
                } else {
                	throw e;
                }
            }
            
            expect(colorChanged, "color of button should change").to.be.true;
            
            await toolboxButton.click();
            
            var toolboxHidden = true;
            try {
                await driver.wait(helper.elementWithoutState(By.id('toolbox'), 'visible'), ANIMATION_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	toolboxHidden = false;
                } else {
                	throw e;
                }
            }
            
            expect(toolboxHidden).to.be.true;
        });
    });
    
    describe('[QR Code]', () => {
        it('should show warning message when the sheet is not saved', async () => {
            await driver.findElement(By.xpath("//*[text()='QR Code']")).click();
            var QRWarnShown = true;
            try {
                await driver.wait(helper.elementAppears(By.xpath('//*[text()="You need to save the sheet before generating QR code."]')), ANIMATION_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	QRWarnShown = false;
                } else {
                	throw e;
                }
            }
            
            expect(QRWarnShown).to.be.true;
        });
        
        it('should show the QR code to the current page when sheet already saved', async () => {
            await driver.findElement(By.xpath("//*[text()='Save']")).click();
            await driver.wait(async () => {return (await driver.getCurrentUrl()) != home;}, REDIRECT_TIMEOUT);
            await driver.findElement(By.xpath("//*[text()='QR Code']")).click();
            await driver.wait(helper.elementWithState(By.id('modalQR'), 'visible'), ANIMATION_TIMEOUT);
            
            expect(await driver.findElement(By.xpath("//*[text()='Here is the QR code of this sheet:']")).isDisplayed()).to.be.true;
            expect(await driver.findElement(By.xpath("//*[@alt='Scan me!']")).isDisplayed()).to.be.true;
            expect(await driver.findElement(By.xpath("//*[text()='Download']")).isDisplayed()).to.be.true;
        });
    });
    
    after(async () => driver.quit());
});