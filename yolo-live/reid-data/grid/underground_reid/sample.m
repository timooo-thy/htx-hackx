
% ftrset = feature set 2784 feature dimension. 1275 cases, with 250 image
% pairs (500 images) + 775 additional images not related to the probe
load features_and_partitions;

% The number of fold in cross validation
nfold = 10; 

% Testing
for nf = 1:nfold
    % Retrieve the probes' feature vectors
    probe_ftr   = ftrset(testIdxAll{nf}.probeImIdx, :);
    
    % Retrieve the galleries' feature vectors
    gallery_ftr = ftrset(testIdxAll{nf}.galleryImIdx, :);
    
    % get the actural number of probe person
    nProbePerson = size(probe_ftr,1);
    
    % Loop for each probe image
    for pl = 1:nProbePerson
        probe_ftr_mat = probe_ftr(pl,:);
        
        % Continue your processing ...
    end
end