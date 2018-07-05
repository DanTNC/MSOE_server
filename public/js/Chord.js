var Chord = new function(){
    this.toabc = (sym) => {
        return Tonal.Chord.notes(sym);
        // return "$#[CEG]";
    };
};