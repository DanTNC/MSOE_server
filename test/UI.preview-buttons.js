const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[preview-buttons] MSOE UI', () => {
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
        await driver.findElement(By.xpath('//*[text()="Preview"]')).click();
    });
    
    describe('[Play]', () => {
        it('should play the music', async () => {
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Edit"]'))), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath('//*[text()="Edit"]')).click();
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Preview"]'))), ANIMATION_TIMEOUT);
            await driver.actions().sendKeys('zzz').perform();
            await driver.wait(until.elementLocated(By.css('path.note.l0.m0.v0')), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath('//*[text()="Preview"]')).click();
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Play"]'))), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath("//*[text()='Play']")).click();
            var musicPlayed = true;
            try {
                await driver.wait(until.elementLocated(By.css('.cursor')), ANIMATION_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	musicPlayed = false;
                } else {
                	throw e;
                }
            }
            
            expect(musicPlayed).to.be.true;
        });
        
        it('should has text "Stop" while playing music', async () => {
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Edit"]'))), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath('//*[text()="Edit"]')).click();
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Preview"]'))), ANIMATION_TIMEOUT);
            await driver.actions().sendKeys('zzz').perform();
            await driver.wait(until.elementLocated(By.css('path.note.l0.m0.v0')), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath('//*[text()="Preview"]')).click();
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Play"]'))), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath("//*[text()='Play']")).click();
            var textBecomesStop = true;
            try {
                await driver.wait(until.elementLocated(By.xpath('//*[text()="Stop"]')), ANIMATION_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	textBecomesStop = false;
                } else {
                	throw e;
                }
            }
            
            expect(textBecomesStop).to.be.true;
        });
        
        it('should has text "Play" while the music stops', async () => {
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Edit"]'))), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath('//*[text()="Edit"]')).click();
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Preview"]'))), ANIMATION_TIMEOUT);
            const notes = 'zzz';
            await driver.actions().sendKeys(notes).perform();
            await driver.wait(until.elementLocated(By.css('path.note.l0.m0.v0')), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath('//*[text()="Preview"]')).click();
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Play"]'))), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath("//*[text()='Play']")).click();
            await driver.wait(until.elementLocated(By.css('.cursor')), ANIMATION_TIMEOUT);
            var textBecomesPlay = true;
            try {
                await driver.wait(until.elementLocated(By.xpath('//*[text()="Play"]')), ANIMATION_TIMEOUT * notes.length);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	textBecomesPlay = false;
                } else {
                	throw e;
                }
            }
            
            expect(textBecomesPlay).to.be.true;
        });
        
        it('should stop the music (while playing)', async () => {
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Edit"]'))), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath('//*[text()="Edit"]')).click();
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Preview"]'))), ANIMATION_TIMEOUT);
            const notes = 'zzz';
            await driver.actions().sendKeys(notes).perform();
            await driver.wait(until.elementLocated(By.css('path.note.l0.m0.v0')), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath('//*[text()="Preview"]')).click();
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Play"]'))), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath("//*[text()='Play']")).click();
            await driver.wait(until.elementLocated(By.css('.cursor')), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath("//*[text()='Stop']")).click();
            var textBecomesPlay = true;
            try {
                await driver.wait(until.elementLocated(By.xpath('//*[text()="Play"]')), ANIMATION_TIMEOUT * notes.length);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                	textBecomesPlay = false;
                } else {
                	throw e;
                }
            }
            
            expect(textBecomesPlay).to.be.true;
        });
    });
    
    
    describe('[Print]', () => {
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
    
    describe('[Share]', () => {
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
    
    after(async () => driver.quit());
});