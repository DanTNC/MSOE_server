const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const { Helper } = require('./helper');
const { PRE_LOADER_TIMEOUT, ANIMATION_TIMEOUT, REDIRECT_TIMEOUT } = require('./constants');

describe('[voice-list] MSOE UI', () => {
    class Clef {
        constructor(name, color) {
            this.name = name;
            this.color = color;
        }
    }
    
    const clefs = [new Clef('treble', 'olive'), new Clef('alto', 'yellow'),
                    new Clef('tenor', 'orange'), new Clef('bass', 'brown')];
    
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
    });
    
    describe('[list]', () => {
        const randomName = () => {
            var name = "";
            var alphabetIndices = new Array(26);
            for (let i = 0; i < 3; i++) {
                name += String.fromCharCode(65 + helper.randomIndex(alphabetIndices));
            }
            return name;
        };
        
        const randomInitVoices = async (useRandomName) => {
            const numVoice = helper.randomIndex(new Array(3)) + 2;
            const chosenClefs = [];
            const voiceNames = [];
            for (let i = 0; i < numVoice; i++) {
                if (i != 0) {
                    await driver.executeScript('MSOE.AddVoice();');
                }
                let [index, clef] = helper.randomItem(clefs);
                chosenClefs.push(clef);
                await driver.executeScript('MSOE.ClfOrVic(49 + arguments[0], true, arguments[1]);', index, i);
                let name = useRandomName? randomName(): String(i);
                await driver.executeScript('MSOE.ChgVicName(arguments[0]);', name);
                voiceNames.push(name);
            }
            
            await driver.executeScript('MSOE.print();');
            
            return {numVoice, chosenClefs, voiceNames};
        };
        
        it('should show current voices with their name and clef', async () => {
            const { numVoice, chosenClefs, voiceNames } = await randomInitVoices();
            const voicesDiv = await driver.findElement(By.css('#voices>div>div'));
            expect(await voicesDiv.findElements(By.css('.row'))).to.have.lengthOf(numVoice);
            expect(await voicesDiv.findElements(By.css('.v_div'))).to.have.lengthOf(numVoice - 1);
            for (let i = 0; i < numVoice; i++) {
                const voiceDiv = await voicesDiv.findElement(By.xpath(`div[@class="row"][${i + 1}]/div`));
                expect(await voiceDiv.findElement(By.css('.v_num')).getAttribute('innerHTML')).to.equal(String(i + 1));
                expect(await voiceDiv.findElement(By.css('.v_clef')).getText()).to.equal(chosenClefs[i].name);
                expect(await voiceDiv.findElement(By.css('.v_name')).getText()).to.equal(voiceNames[i]);
                expect((await voiceDiv.getAttribute('class')).includes(chosenClefs[i].color)).to.be.true;
            }
        });
        
        it('should swap voices when user clicks on left-most numbers of two voices sequentially', async () => {
            const { numVoice } = await randomInitVoices(false);
            const A_index = helper.randomIndex(new Array(numVoice));
            var B_index_temp = helper.randomIndex(new Array(numVoice - 1));
            var B_index;
            if (B_index_temp >= A_index) {
                B_index = B_index_temp + 1;
            } else {
                B_index = B_index_temp;
            }
            
            await driver.findElement(By.xpath(`(//a[contains(@class, "v_num")])[${A_index + 1}]`)).click();
            await driver.findElement(By.xpath(`(//a[contains(@class, "v_num")])[${B_index + 1}]`)).click();
            
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[${A_index + 1}]`)).getText()).to.equal(String(B_index));
            expect(await driver.findElement(By.xpath(`(//a[contains(@class, "v_name")])[${B_index + 1}]`)).getText()).to.equal(String(A_index));
        });
    });
    
    after(async () => driver.quit());
});