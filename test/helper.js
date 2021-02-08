const defaultIndex = 'WPR21F2BZT';
const defaultKey = 'FTBT+6SPTLB7BNCYJEYZ';

function generatePathByIndexKey(editMode, index, key) {
    index = index || defaultIndex;
    if (editMode) {
        key = key || defaultKey;
        key = '!' + key;
    } else {
        key = '';
    }
    return '?!' + index + key;
}

module.exports = {
    defaultIndex,
    defaultKey,
    generatePathByIndexKey,
};