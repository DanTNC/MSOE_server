const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const screen = {
    width: 1024,
    height: 768
};

describe('MSOE UI', () => {
    const PRE_LOADER_TIMEOUT = 5000;
    const ANIMATION_TIMEOUT = 5000;
    
    const driver = new Builder()
                    .forBrowser('chrome')
                    .setChromeOptions(new chrome.Options().headless().windowSize(screen))
                    .build();
    
    const modalState = (id_, state) => {
        return async () => {
            return (await driver.findElement(By.id(id_)).getAttribute('class')).includes(state);
        };
    };
    
    var host;
    
    before(async () => { // get public ip by shell command
        const { stdout, stderr } = await exec("curl -s http://169.254.169.254/latest/meta-data/public-ipv4");
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        host = stdout;
    });

    it('should go back to home when the logo is clicked', async () => {
        await driver.get('http://' + host + ':8080/');
        await driver.wait(until.elementIsNotVisible(driver.findElement(By.id('preloader'))), PRE_LOADER_TIMEOUT);
        await driver.findElement(By.id('infomodal')).click();
        await driver.wait(modalState('modaldiv2', 'visible'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('submit')).sendKeys(Key.ENTER);
        await driver.wait(modalState('modaldiv2', 'hidden'), ANIMATION_TIMEOUT);
        await driver.findElement(By.id('logo')).click();
        await driver.wait(modalState('modaldiv1', 'visible'), ANIMATION_TIMEOUT);
        const buttonText = await driver.findElement(By.id('infomodal')).getAttribute('innerHTML');

        expect(buttonText).to.equal('START');
    });

    after(async () => driver.quit());
});