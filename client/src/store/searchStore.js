import {defineStore} from 'pinia';

export const useSearchStore = defineStore('searchStore', {
    state: () => ({
        searchTerm: '',
        dnaSequence: '',
    }),
    actions: {
        setSearchTerm(term) {
            this.searchTerm = term;
        },
        setDnaSequence(sequence) {
            this.dnaSequence = sequence;
        },
        clearSearchData() {
            this.searchTerm = '';
            this.dnaSequence = '';
        },
    },
    persist: true,
});
