const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { screen, PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[info] MSOE UI', () => {
    const fields = [
        "whoiseditor",
        "whoiscomposer",
        "whatistitle",
        "whatissubtitle",
        "whichalbum",
        "whoisartist",
    ];
    
    const driver = new Builder()
                    .forBrowser('chrome')
                    .setChromeOptions(new chrome.Options().headless().windowSize(screen))
                    .build();
                    
    const modalStateCheck = async (id_, state) => {
        return (await driver.findElement(By.id(id_)).getAttribute('class')).includes(state);
    };
    
    const modalState = (id_, state) => {
        return async () => {
            return await modalStateCheck(id_, state);
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
        console.log(home);
    });
    
    beforeEach(async () => { // go to info modal
        await goTo();
        await driver.findElement(By.id('infomodal')).click();
        await driver.wait(modalState('modaldiv2', 'visible'), ANIMATION_TIMEOUT);
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
        await driver.wait(modalState('modaldiv2', 'hidden'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('infohome')).click();
        await driver.wait(modalState('modaldiv2', 'visible'), ANIMATION_TIMEOUT);
        
        expect(await (driver.findElement(By.name(field))).getAttribute("value")).to.equal("test");
    });
    
    it('should restore previous value when [undo] is fired by user', async () => {
        const field_index = Math.floor(Math.random() * fields.length);
        const field = fields[field_index];
        const input_field = await driver.findElement(By.name(field));
        await input_field.sendKeys("test");
        await driver.findElement(By.id('submit')).click();
        await driver.wait(modalState('modaldiv2', 'hidden'), ANIMATION_TIMEOUT);
        await driver.actions().keyDown(Key.CONTROL).sendKeys('z').keyUp(Key.CONTROL).perform();
        await driver.findElement(By.id('infohome')).click();
        await driver.wait(modalState('modaldiv2', 'visible'), ANIMATION_TIMEOUT);
        
        expect(await (driver.findElement(By.name(field))).getAttribute("value")).to.equal("");
    });
    
    after(async () => driver.quit());
});