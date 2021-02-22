const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { Helper, deleteDir } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT, DOWNLOAD_TIMEOUT } = require('./constants');
const path = require('path');
const fs = require('fs');

describe('[preview-buttons] MSOE UI', () => {
    const helper = new Helper();
    
    const tempDir = path.resolve(__dirname, 'temp_3');
    
    deleteDir(fs, path, tempDir);
    fs.mkdirSync(tempDir);
    
    const driver = helper.buildDriver((options) => {
        return options.setUserPreferences({
          'download.default_directory': tempDir,
          'download.prompt_for_download': false, // Maybe
        });
    });
    
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
    
    describe('[Play]', () => {
        it('should play the music', async () => {
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
        it('should print the sheet (by calling printJS with "sheet" and "html")', async () => {
            await driver.findElement(By.xpath('//*[text()="Preview"]')).click();
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Print"]'))), ANIMATION_TIMEOUT);
            const args = await driver.executeScript(
                'var args = ["", ""];' + 
                'printJS = (id, typ) => {args = [id, typ];};' + 
                'arguments[0].click();' + 
                'return args', driver.findElement(By.xpath('//*[text()="Print"]')));
            
            expect(args[0]).to.equal('sheet');
            expect(args[1]).to.equal('html');
        });
    });
    
    describe('[Share]', () => {
        it('should download the midi file of the sheet with the title as filename', async () => {
            await driver.findElement(By.xpath('//*[text()="Score Info"]')).click();
            await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'visible'), ANIMATION_TIMEOUT);
            const title = 'title';
            await driver.findElement(By.name('whatistitle')).sendKeys(title);
            await driver.findElement(By.id('submit')).sendKeys(Key.ENTER);
            await driver.wait(helper.elementWithState(By.id('modaldiv2'), 'hidden'), ANIMATION_TIMEOUT);
            await driver.actions().sendKeys('zzz').perform();
            await driver.wait(until.elementLocated(By.css('path.note.l0.m0.v0')), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath('//*[text()="Preview"]')).click();
            await driver.wait(until.elementIsVisible(driver.findElement(By.xpath('//*[text()="Share"]'))), ANIMATION_TIMEOUT);
            await driver.findElement(By.xpath("//*[text()='Share']")).click();
            
            var fileDownloaded = true;
            try {
                driver.wait(() => {
                    return fs.existsSync(path.resolve(tempDir, title + '.midi'));
                }, DOWNLOAD_TIMEOUT);
            } catch (e) {
                if (e.name == 'TimeoutException') {
                    fileDownloaded = false;
                } else {
                    throw e;
                }
            }
            
            expect(fileDownloaded).to.be.true;
        });
    });
    
    after(async () => {
        driver.quit();
        deleteDir(fs, path, tempDir);
    });
});