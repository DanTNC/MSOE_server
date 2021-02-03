const { Builder, By, Key, until } = require('selenium-webdriver');
const { chrome } = require('selenium-webdriver/chrome');
const { expect } = require('chai');

const screen = {
    width: 640,
    height: 480
};

describe('DefaultTest', () => {
    const driver = new Builder()
                    .forBrowser('chrome')
                    .setChromeOptions(new chrome.Options().headless().windowSize(screen))
                    .build();

    it('should go to nehalist.io and check the title', async () => {
        await driver.get('https://www.google.com');
        await driver.findElement(By.name('q')).sendKeys('nehalist', Key.ENTER);
        await driver.wait(until.elementLocated(By.id('search')));
        const link = await driver.findElement(By.xpath("//a[@href='https://nehalist.io/']"));
        await driver.executeScript('arguments[0].click()', link)
        const title = await driver.getTitle();

        expect(title).to.equal('nehalist.io');
    });

    after(async () => driver.quit());
});