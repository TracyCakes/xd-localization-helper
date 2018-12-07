/*
 * Copyright (c) 2018 by Pablo Klaschka
 */

const fs = require('uxp').storage;
const lfs = fs.localFileSystem;

let lang;

let defaultEntries = undefined;
let languageEntries = undefined;

/**
 * The main LocalizationHelper class
 * @class LocalizationHelper
 * @alias module:xd-localization-helper
 * @static
 */
class LocalizationHelper {
    /**
     * The currently used language
     * @return {string} The language code
     */
    static get lang() {
        return lang;
    }

    /**
     * Determines if the current language has a translation (in general, not for a specific key)
     * @return {boolean} Translation exists for the current language
     */
    static get hasTranslation() {
        return languageEntries !== undefined;
    }

    /**
     * @private
     * "Unloads" the library (with all translations)
     * @return {void}
     */
    static unload() {
        lang = undefined;
        defaultEntries = undefined;
        languageEntries = undefined;
    }

    /**
     * Initializes the helper. Must be completed before calling {@link LocalizationHelper.get}
     * @param {string} [translationFolderLocation='lang'] The translation folder name (in the plugin folder)
     * @param {Object} [config] Further configuration
     * @param {string?} [config.overrideLanguage=null] Overrides the language (to use another translation instead of the app's UI language)
     * @return {Promise<boolean>} Promise that resolves when the translations loaded successfully (resolves to true if it was successful)
     */
    static async load(translationFolderLocation, config) {
        this.unload();

        lang = require('application').appLanguage;

        if (!translationFolderLocation)
            translationFolderLocation = 'lang';

        let options = {
            overrideLanguage: null,
        };
        options = Object.assign(options, config || {});

        try {
            const pluginFolder = await lfs.getPluginFolder();

            if (!(await pluginFolder.getEntries()).find(entry => entry.name === translationFolderLocation))
                throw 'translationFolderLocation \'' + translationFolderLocation + '\' doesn\'t exist';

            const translationFolder = await pluginFolder.getEntry(translationFolderLocation);

            if (translationFolder.isFolder) {
                const entries = await translationFolder.getEntries();

                if (entries.find(entry => entry.name === 'default.json')) {
                    const defaultFile = await translationFolder.getEntry('default.json');
                    defaultEntries = JSON.parse((await defaultFile.read({format: fs.formats.utf8})).toString());
                } else {
                    throw 'no default.json file was found...';
                }

                lang = options.overrideLanguage ? options.overrideLanguage : lang;

                if (entries.find(entry => entry.name === lang + '.json')) {
                    const defaultFile = await translationFolder.getEntry(lang + '.json');
                    languageEntries = JSON.parse((await defaultFile.read({format: fs.formats.utf8})).toString());
                } else {
                    languageEntries = undefined;
                }

                return true;
            } else {
                throw 'translationFolderLocation \'' + translationFolderLocation + '\' is not a folder';
            }
        } catch (e) {
            throw 'Localization helper: Translations didn\'t load successfully: ' + e;
        }
    }

    /**
     * Gets the correct string for a key
     * @param {string} key The key of the string
     * @return {string} The correct translation or the default value for the key
     * @throws An error if neither a translation nor a default value for the key are specified
     */
    static get(key) {
        if (languageEntries && languageEntries.hasOwnProperty(key)) {
            return languageEntries[key];
        } else if (!defaultEntries)
            throw 'Localization helper: The library wasn\'t initialized. Please use \'LocalizationHelper.load()\' before getting a string.';
        else if (defaultEntries.hasOwnProperty(key)) {
            return defaultEntries[key];
        } else {
            throw 'Localization helper: Unspecified string key: \'' + key + '\'';
        }
    }
}

/**
 * The xd-localization-helper module
 * @module xd-localization-helper
 */
module.exports = LocalizationHelper;